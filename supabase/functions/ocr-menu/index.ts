import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are a menu OCR assistant. Analyze the menu content and extract all menu items.
Return ONLY a valid JSON array with objects containing:
- name: string (item name in Portuguese)
- price: string (numeric price without currency symbol, use . as decimal separator)
- category: string (guessed category like "Bebidas", "Salgados", "Doces", "Lanches", "Pratos", "Cafés", etc.)
- description: string (brief appetizing description in Portuguese, max 60 chars, describing ingredients or taste)

Example output:
[{"name": "Café Expresso", "price": "5.00", "category": "Cafés", "description": "Café intenso e encorpado, puro sabor brasileiro"}, {"name": "Pão de Queijo", "price": "4.50", "category": "Salgados", "description": "Tradicional mineiro, crocante por fora e macio por dentro"}]

If you cannot identify any items, return an empty array: []
Do not include any explanation, only the JSON array.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, fileType } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image or PDF is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Processing file type:', fileType || 'image');

    // For PDFs, we'll still use image vision - the model can handle base64 PDFs
    // PDFs are converted to base64 on the client side
    const isPDF = fileType === 'pdf';
    
    // Use Lovable AI Gateway with vision model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: isPDF 
                  ? 'This is a PDF menu document. Extract all menu items from it. Return only the JSON array.'
                  : 'Extract all menu items from this image. Return only the JSON array.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    console.log('AI response content:', content);

    // Parse the JSON response
    let items: Array<{ name: string; price: string; category: string; description: string }> = [];
    try {
      // Clean up the response (remove markdown code blocks if present)
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('Cleaned content:', cleanContent);
      
      const parsed = JSON.parse(cleanContent);
      
      // Validate the items array
      if (Array.isArray(parsed)) {
        // Filter and validate each item
        items = parsed.filter((item: unknown) => {
          if (typeof item !== 'object' || item === null) return false;
          const obj = item as Record<string, unknown>;
          return typeof obj.name === 'string' && 
                 obj.name.trim() !== '' &&
                 typeof obj.price === 'string';
        }).map((item: unknown) => {
          const obj = item as Record<string, unknown>;
          return {
            name: (obj.name as string).trim(),
            price: (obj.price as string).replace(/[^\d.]/g, '') || '0',
            category: typeof obj.category === 'string' ? obj.category.trim() : 'Geral',
            description: typeof obj.description === 'string' ? obj.description.trim().slice(0, 100) : '',
          };
        });
      }
      
      console.log('Parsed items:', items.length, 'items found');
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      items = [];
    }

    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('OCR Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Falha ao processar arquivo', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
