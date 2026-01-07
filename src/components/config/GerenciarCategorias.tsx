import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logError } from '@/lib/errorLogger';
import { categorySchema } from '@/lib/validation';

interface GerenciarCategoriasProps {
  onBack: () => void;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
}

const categoryTypes = [
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'salgados', label: 'Salgados' },
  { value: 'sobremesas', label: 'Sobremesas' },
  { value: 'flores', label: 'Flores' },
];

export function GerenciarCategorias({ onBack }: GerenciarCategoriasProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'bebidas' });
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data as Category[];
    },
  });

  const openNewCategory = () => {
    setEditingCategory(null);
    setFormData({ name: '', type: 'bebidas' });
    setDialogOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, type: category.type });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Preencha o nome da categoria');
      return;
    }

    // Validate with Zod schema
    const categoryData = {
      name: formData.name.trim(),
      type: formData.type,
    };
    
    const validation = categorySchema.safeParse(categoryData);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Dados inválidos');
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Categoria atualizada');
      } else {
        const { error } = await supabase.from('categories').insert(categoryData);
        if (error) throw error;
        toast.success('Categoria adicionada');
      }
      
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDialogOpen(false);
    } catch (error) {
      logError(error, 'Error saving category');
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Remover "${category.name}"? Produtos desta categoria ficarão sem categoria.`)) return;
    
    try {
      // Remove category reference from products first
      await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', category.id);
      
      const { error } = await supabase.from('categories').delete().eq('id', category.id);
      if (error) throw error;
      
      toast.success('Categoria removida');
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      logError(error, 'Error deleting category');
      toast.error('Erro ao remover categoria');
    }
  };

  const getTypeLabel = (type: string) => categoryTypes.find(t => t.value === type)?.label || type;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Categorias</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categorias</p>
        </div>
        <Button onClick={openNewCategory} size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> Nova
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Nenhuma categoria</p>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border/50"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{category.name}</p>
                <p className="text-xs text-muted-foreground">{getTypeLabel(category.type)}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCategory(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(category)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da categoria"
              />
            </div>

            <div>
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </div>
  );
}
