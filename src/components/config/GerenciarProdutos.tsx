import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Search, Pencil, Trash2, Package, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logError } from '@/lib/errorLogger';
import { productSchema } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface GerenciarProdutosProps {
  onBack: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category_id: string | null;
  is_active: boolean;
  stock: number;
  category?: { name: string; type: string } | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function GerenciarProdutos({ onBack }: GerenciarProdutosProps) {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category_id: '',
    stock: '100',
  });
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-admin', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(name, type)')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!currentOrganization,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data as Category[];
    },
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openNewProduct = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', description: '', category_id: '', stock: '100' });
    setDialogOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category_id: product.category_id || '',
      stock: product.stock.toString(),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Preencha nome e preço');
      return;
    }

    const productData = {
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      description: formData.description?.trim() || null,
      category_id: formData.category_id || null,
      stock: parseInt(formData.stock) || 100,
      is_active: true,
    };

    // Validate with Zod schema
    const validation = productSchema.safeParse(productData);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Dados inválidos');
      return;
    }

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Produto atualizado');
      } else {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
        toast.success('Produto adicionado');
      }
      
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
    } catch (error) {
      logError(error, 'Error saving product');
      toast.error('Erro ao salvar produto');
    }
  };

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productToDelete.id);
      if (error) throw error;
      
      toast.success('Produto removido');
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      logError(error, 'Error deleting product');
      toast.error('Erro ao remover produto');
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, envie uma imagem do cardápio.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB.');
      return;
    }

    setIsProcessingOCR(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('ocr-menu', {
        body: { image: base64 },
      });

      if (error) throw error;

      if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
        console.log('OCR items received:', data.items);
        
        // Fetch fresh categories from the database (including global ones)
        const { data: freshCategories, error: catFetchError } = await supabase
          .from('categories')
          .select('*')
          .or(`organization_id.eq.${currentOrganization?.id},organization_id.is.null`)
          .order('name');
        
        if (catFetchError) {
          console.error('Error fetching categories:', catFetchError);
        }
        
        const allCategories = freshCategories || categories;
        console.log('Available categories:', allCategories.map(c => c.name));
        
        // Normalize function for better matching
        const normalize = (str: string) => 
          str.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
        
        // Extract unique categories from OCR results
        const uniqueCategories = [...new Set(data.items.map((item: any) => item.category || 'Geral'))];
        console.log('OCR unique categories:', uniqueCategories);
        
        const categoryMap: Record<string, string> = {};

        // Create or find categories - process sequentially to avoid race conditions
        for (const categoryName of uniqueCategories) {
          const catName = (categoryName as string).trim();
          const normalizedCatName = normalize(catName);
          
          // Find existing category with fuzzy matching
          const existingCat = allCategories.find(c => normalize(c.name) === normalizedCatName);
          
          if (existingCat) {
            console.log(`Category "${catName}" found with ID: ${existingCat.id}`);
            categoryMap[catName] = existingCat.id;
          } else {
            console.log(`Creating new category: "${catName}" for org: ${currentOrganization?.id}`);
            
            const { data: cat, error: catError } = await supabase
              .from('categories')
              .insert({
                name: catName,
                type: 'bebidas',
                organization_id: currentOrganization?.id,
              })
              .select()
              .single();

            if (catError) {
              console.error(`Error creating category "${catName}":`, catError);
            } else if (cat) {
              console.log(`Category "${catName}" created with ID: ${cat.id}`);
              categoryMap[catName] = cat.id;
            }
          }
        }

        console.log('Final category map:', categoryMap);

        // Create products with their categories
        const productsToInsert = data.items.map((item: any) => {
          const itemCategory = item.category || 'Geral';
          const categoryId = categoryMap[itemCategory] || null;
          console.log(`Product "${item.name}" → category "${itemCategory}" → ID: ${categoryId}`);
          
          return {
            name: item.name,
            price: parseFloat(item.price) || 0,
            category_id: categoryId,
            organization_id: currentOrganization?.id,
            is_active: true,
            stock: 100,
          };
        });

        console.log('Products to insert:', productsToInsert);

        const { error: prodError } = await supabase.from('products').insert(productsToInsert);
        if (prodError) {
          console.error('Error inserting products:', prodError);
          throw prodError;
        }

        queryClient.invalidateQueries({ queryKey: ['products-admin'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['categories-admin'] });

        toast.success(`${data.items.length} itens importados do cardápio!`);
      } else {
        toast.error('Nenhum item encontrado. Tente uma imagem mais clara.');
      }
    } catch (error) {
      logError(error, 'OCR Error');
      toast.error('Erro ao processar imagem. Tente novamente.');
    } finally {
      setIsProcessingOCR(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Cardápio</h2>
          <p className="text-sm text-muted-foreground">{products.length} produtos</p>
        </div>
        <Button onClick={openNewProduct} size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      {/* Upload Menu */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer",
          isProcessingOCR 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
        onClick={() => !isProcessingOCR && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        {isProcessingOCR ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando cardápio com IA...</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Enviar foto do cardápio (IA identifica itens)</p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border/50"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category?.name || 'Sem categoria'}</p>
              </div>
              <p className="font-semibold text-primary">{formatCurrency(product.price)}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditProduct(product)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(product)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do produto"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Estoque</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <Label>Categoria</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto "{productToDelete?.name}" será removido do cardápio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
