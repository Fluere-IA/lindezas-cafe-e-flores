import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logError } from '@/lib/errorLogger';
import { productSchema } from '@/lib/validation';

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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category_id: '',
    stock: '100',
  });
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(name, type)')
        .order('name');
      if (error) throw error;
      return data as Product[];
    },
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

  const handleDelete = async (product: Product) => {
    if (!confirm(`Remover "${product.name}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', product.id);
      if (error) throw error;
      
      toast.success('Produto removido');
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      logError(error, 'Error deleting product');
      toast.error('Erro ao remover produto');
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
          <h2 className="text-lg font-semibold text-lindezas-forest">Cardápio</h2>
          <p className="text-sm text-muted-foreground">{products.length} produtos</p>
        </div>
        <Button onClick={openNewProduct} size="sm" className="bg-lindezas-forest hover:bg-lindezas-forest/90">
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
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
                <p className="font-medium text-lindezas-forest truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category?.name || 'Sem categoria'}</p>
              </div>
              <p className="font-semibold text-lindezas-gold">{formatCurrency(product.price)}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditProduct(product)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(product)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog */}
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
              <Button className="flex-1 bg-lindezas-forest hover:bg-lindezas-forest/90" onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
