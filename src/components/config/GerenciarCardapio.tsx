import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Search, Pencil, Trash2, Package, ImageIcon, Loader2, Tag, ChevronDown, ChevronRight, GripVertical, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { logError } from '@/lib/errorLogger';
import { productSchema, categorySchema } from '@/lib/validation';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GerenciarCardapioProps {
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
  organization_id: string | null;
  position: number;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  organization_id: string | null;
  position: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Droppable Category Component
function DroppableCategory({ 
  category, 
  products, 
  isExpanded, 
  onToggle, 
  onEditCategory, 
  onDeleteCategory, 
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  search,
  isOver,
}: {
  category: Category;
  products: Product[];
  isExpanded: boolean;
  onToggle: () => void;
  onEditCategory: (cat: Category) => void;
  onDeleteCategory: (cat: Category) => void;
  onAddProduct: (categoryId: string) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  search: string;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `category-${category.id}` });

  const isGlobal = !category.organization_id;
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-card rounded-xl border border-border/50 overflow-hidden transition-all",
        isOver && "ring-2 ring-primary border-primary"
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center">
          <CollapsibleTrigger asChild>
            <button className="flex-1 flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors pl-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{category.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">{products.length} produtos</p>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={(e) => { e.stopPropagation(); onEditCategory(category); }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive" 
                  onClick={(e) => { e.stopPropagation(); onDeleteCategory(category); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={(e) => { e.stopPropagation(); onAddProduct(category.id); }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="border-t border-border/50 px-3 pb-2">
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center">
                {isOver ? "Solte aqui para mover" : "Nenhum produto nesta categoria"}
              </p>
            ) : (
              <SortableContext items={filteredProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {filteredProducts.map((product) => (
                  <SortableProduct 
                    key={product.id} 
                    product={product} 
                    onEdit={onEditProduct}
                    onDelete={onDeleteProduct}
                  />
                ))}
              </SortableContext>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Sortable Category Wrapper (for reordering categories)
function SortableCategoryWrapper({ 
  category, 
  children 
}: { 
  category: Category;
  children: React.ReactNode;
}) {
  const isGlobal = !category.organization_id;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: isGlobal });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isGlobal) {
    return <>{children}</>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors touch-none z-10 rounded-l-xl"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="pl-8">
        {children}
      </div>
    </div>
  );
}

// Uncategorized Droppable Component
function UncategorizedDroppable({
  products,
  isExpanded,
  onToggle,
  onEditProduct,
  onDeleteProduct,
  search,
  isOver,
}: {
  products: Product[];
  isExpanded: boolean;
  onToggle: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  search: string;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: 'category-uncategorized' });
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={setNodeRef}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className={cn(
          "bg-card rounded-xl border border-dashed border-border overflow-hidden transition-all",
          isOver && "ring-2 ring-primary border-primary"
        )}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
              <div className="p-2 rounded-lg bg-muted">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-muted-foreground">Sem categoria</p>
                <p className="text-xs text-muted-foreground">{products.length} produtos</p>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-dashed border-border px-3 pb-2">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">
                  {isOver ? "Solte aqui para mover" : "Nenhum produto sem categoria"}
                </p>
              ) : (
                <SortableContext items={filteredProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {filteredProducts.map((product) => (
                    <SortableProduct 
                      key={product.id} 
                      product={product} 
                      onEdit={onEditProduct}
                      onDelete={onDeleteProduct}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}

// Sortable Product Component
function SortableProduct({ 
  product, 
  onEdit, 
  onDelete 
}: { 
  product: Product; 
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 py-2 px-1 rounded-lg hover:bg-muted/50 transition-colors",
        isDragging && "shadow-md bg-card opacity-90 z-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded transition-colors touch-none"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
        {product.description && (
          <p className="text-xs text-muted-foreground truncate">{product.description}</p>
        )}
      </div>
      <p className="text-sm font-semibold text-primary shrink-0">{formatCurrency(product.price)}</p>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(product)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-destructive hover:text-destructive" 
          onClick={() => onDelete(product)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function GerenciarCardapio({ onBack }: GerenciarCardapioProps) {
  const [search, setSearch] = useState('');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['uncategorized']));
  const [productFormData, setProductFormData] = useState({
    name: '',
    price: '',
    description: '',
    category_id: '',
    stock: '100',
  });
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [overCategoryId, setOverCategoryId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ file: File; preview: string } | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products-admin', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!currentOrganization,
  });

  // Fetch categories (global + organization)
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories-admin', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`organization_id.eq.${currentOrganization?.id},organization_id.is.null`)
        .order('position', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!currentOrganization,
  });

  const isLoading = productsLoading || categoriesLoading;

  // Separate global and custom categories
  const globalCategories = categories.filter(c => !c.organization_id);
  const customCategories = categories.filter(c => c.organization_id);

  // Group products by category
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category.id] = products.filter(p => p.category_id === category.id);
    return acc;
  }, {} as Record<string, Product[]>);

  // Products without category
  const uncategorizedProducts = products.filter(p => !p.category_id);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Find the active product for drag overlay
  const activeProduct = activeProductId ? products.find(p => p.id === activeProductId) : null;

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Check if it's a product (not a category)
    const isProduct = products.some(p => p.id === active.id);
    if (isProduct) {
      setActiveProductId(active.id as string);
    }
  };

  // Handle drag over (detect which category we're hovering)
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverCategoryId(null);
      return;
    }

    // Check if we're over a category droppable
    const overId = over.id as string;
    if (overId.startsWith('category-')) {
      setOverCategoryId(overId.replace('category-', ''));
    } else {
      // Check if we're over a product - find its category
      const overProduct = products.find(p => p.id === overId);
      if (overProduct) {
        setOverCategoryId(overProduct.category_id || 'uncategorized');
      }
    }
  };

  // Unified drag end handler for products and categories
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProductId(null);
    setOverCategoryId(null);
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if it's a product drag
    const isProductDrag = products.some(p => p.id === activeId);
    
    if (isProductDrag) {
      const draggedProduct = products.find(p => p.id === activeId);
      if (!draggedProduct) return;

      // Determine target category
      let targetCategoryId: string | null = null;
      
      if (overId.startsWith('category-')) {
        // Dropped on a category zone
        targetCategoryId = overId.replace('category-', '');
        if (targetCategoryId === 'uncategorized') targetCategoryId = null;
      } else {
        // Dropped on another product - get its category
        const overProduct = products.find(p => p.id === overId);
        if (overProduct) {
          targetCategoryId = overProduct.category_id;
        } else {
          // Check if it's a category (for category reordering)
          const isCategory = categories.some(c => c.id === overId);
          if (isCategory && activeId !== overId) {
            await handleCategoryReorder(activeId, overId);
          }
          return;
        }
      }

      // Same category - reorder
      if (draggedProduct.category_id === targetCategoryId) {
        const categoryProducts = targetCategoryId 
          ? productsByCategory[targetCategoryId] || []
          : uncategorizedProducts;
        
        const oldIndex = categoryProducts.findIndex(p => p.id === activeId);
        const newIndex = categoryProducts.findIndex(p => p.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(categoryProducts, oldIndex, newIndex);
          try {
            const updates = reordered.map((prod, index) => 
              supabase.from('products').update({ position: index }).eq('id', prod.id)
            );
            await Promise.all(updates);
            queryClient.invalidateQueries({ queryKey: ['products-admin'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
          } catch (error) {
            logError(error, 'Error reordering products');
            toast.error('Erro ao reordenar produtos');
          }
        }
      } else {
        // Different category - move product
        try {
          const { error } = await supabase
            .from('products')
            .update({ category_id: targetCategoryId, position: 0 })
            .eq('id', activeId);
          
          if (error) throw error;
          
          toast.success('Produto movido para nova categoria');
          queryClient.invalidateQueries({ queryKey: ['products-admin'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error) {
          logError(error, 'Error moving product');
          toast.error('Erro ao mover produto');
        }
      }
    } else {
      // Category reorder
      await handleCategoryReorder(activeId, overId);
    }
  };

  // Category reorder helper
  const handleCategoryReorder = async (activeId: string, overId: string) => {
    const oldIndex = customCategories.findIndex(c => c.id === activeId);
    const newIndex = customCategories.findIndex(c => c.id === overId);
    
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(customCategories, oldIndex, newIndex);
    
    try {
      const updates = reordered.map((cat, index) => 
        supabase.from('categories').update({ position: index }).eq('id', cat.id)
      );
      await Promise.all(updates);
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      logError(error, 'Error reordering categories');
      toast.error('Erro ao reordenar categorias');
    }
  };

  // Product handlers
  const openNewProduct = (categoryId?: string) => {
    setEditingProduct(null);
    setProductFormData({ name: '', price: '', description: '', category_id: categoryId || '', stock: '100' });
    setProductDialogOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category_id: product.category_id || '',
      stock: product.stock.toString(),
    });
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productFormData.name || !productFormData.price) {
      toast.error('Preencha nome e preço');
      return;
    }

    const productData = {
      name: productFormData.name.trim(),
      price: parseFloat(productFormData.price),
      description: productFormData.description?.trim() || null,
      category_id: productFormData.category_id || null,
      stock: parseInt(productFormData.stock) || 100,
      is_active: true,
      organization_id: currentOrganization?.id,
    };

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
      setProductDialogOpen(false);
    } catch (error) {
      logError(error, 'Error saving product');
      toast.error('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async () => {
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
      setDeleteProductDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // Category handlers
  const openNewCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '' });
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({ name: category.name });
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name) {
      toast.error('Preencha o nome da categoria');
      return;
    }

    const categoryData = {
      name: categoryFormData.name.trim(),
      type: 'cafeteria',
      organization_id: currentOrganization?.id,
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
          .update({ name: categoryData.name })
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Categoria atualizada');
      } else {
        // Get max position for new category
        const maxPosition = Math.max(0, ...customCategories.map(c => c.position || 0));
        const { error } = await supabase.from('categories').insert({ ...categoryData, position: maxPosition + 1 });
        if (error) throw error;
        toast.success('Categoria adicionada');
      }
      
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryDialogOpen(false);
    } catch (error) {
      logError(error, 'Error saving category');
      toast.error('Erro ao salvar categoria');
    }
  };

  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', categoryToDelete.id);
      
      const { error } = await supabase.from('categories').delete().eq('id', categoryToDelete.id);
      if (error) throw error;
      
      toast.success('Categoria removida');
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
    } catch (error) {
      logError(error, 'Error deleting category');
      toast.error('Erro ao remover categoria');
    } finally {
      setDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  // Prepare file for preview
  const prepareFilePreview = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (!isImage && !isPDF) {
      toast.error('Por favor, envie uma imagem ou PDF do cardápio.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 20MB.');
      return;
    }

    // Create preview URL
    const preview = isImage ? URL.createObjectURL(file) : '';
    setPreviewFile({ file, preview });
    setPreviewDialogOpen(true);
  };

  // Cancel preview
  const cancelPreview = () => {
    if (previewFile?.preview) {
      URL.revokeObjectURL(previewFile.preview);
    }
    setPreviewFile(null);
    setPreviewDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirm and process file
  const confirmAndProcessFile = async () => {
    if (!previewFile) return;
    
    setPreviewDialogOpen(false);
    const file = previewFile.file;
    
    // Cleanup preview
    if (previewFile.preview) {
      URL.revokeObjectURL(previewFile.preview);
    }
    setPreviewFile(null);

    // Process the file
    const isPDF = file.type === 'application/pdf';
    setIsProcessingOCR(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('ocr-menu', {
        body: { image: base64, fileType: isPDF ? 'pdf' : 'image' },
      });

      if (error) throw error;

      await processOCRResults(data);
    } catch (error) {
      logError(error, 'OCR Error');
      toast.error('Erro ao processar arquivo. Tente novamente.');
    } finally {
      setIsProcessingOCR(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Process OCR results
  const processOCRResults = async (data: any) => {
    if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
      const normalize = (str: string) => 
        str.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();
      
      const uniqueCategories = [...new Set(data.items.map((item: any) => item.category || 'Geral'))];
      const categoryMap: Record<string, string> = {};

      for (const categoryName of uniqueCategories) {
        const catName = (categoryName as string).trim();
        const normalizedCatName = normalize(catName);
        
        const existingCat = categories.find(c => normalize(c.name) === normalizedCatName);
        
        if (existingCat) {
          categoryMap[catName] = existingCat.id;
        } else {
          const maxPosition = Math.max(0, ...customCategories.map(c => c.position || 0));
          const { data: cat, error: catError } = await supabase
            .from('categories')
            .insert({
              name: catName,
              type: 'cafeteria',
              organization_id: currentOrganization?.id,
              position: maxPosition + 1,
            })
            .select()
            .single();

          if (!catError && cat) {
            categoryMap[catName] = cat.id;
          }
        }
      }

      const productsToInsert = data.items.map((item: any, index: number) => ({
        name: item.name,
        price: parseFloat(item.price) || 0,
        description: item.description || null,
        category_id: categoryMap[item.category || 'Geral'] || null,
        organization_id: currentOrganization?.id,
        is_active: true,
        stock: 100,
        position: index,
      }));

      const { error: prodError } = await supabase.from('products').insert(productsToInsert);
      if (prodError) throw prodError;

      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });

      toast.success(`${data.items.length} itens importados do cardápio!`);
    } else {
      toast.error('Nenhum item encontrado. Tente um arquivo mais claro.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await prepareFilePreview(file);
  };

  // Handle paste from clipboard
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await prepareFilePreview(file);
        }
        break;
      }
    }
  };

  // Handle drag and drop for file upload
  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await prepareFilePreview(file);
    }
  };

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
          <p className="text-sm text-muted-foreground">{categories.length} categorias · {products.length} produtos</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button onClick={() => openNewProduct()} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Adicionar Produto
        </Button>
        <Button onClick={openNewCategory} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1.5" /> Adicionar Categoria
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
        onPaste={handlePaste}
        onDrop={handleFileDrop}
        onDragOver={handleFileDragOver}
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        {isProcessingOCR ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando cardápio com IA...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center gap-2">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Importar cardápio via foto ou PDF</p>
            </div>
            <p className="text-xs text-muted-foreground/70">Clique, arraste ou cole (Ctrl+V) uma imagem</p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Drag hint */}
      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <GripVertical className="h-3 w-3" /> Arraste para reordenar ou mover entre categorias
      </p>

      {/* Categories & Products - Single DndContext for cross-category movement */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-2">
            {/* All categories with products */}
            <SortableContext items={[...customCategories.map(c => c.id), ...products.map(p => p.id)]} strategy={verticalListSortingStrategy}>
              {/* Global categories */}
              {globalCategories.map((category) => (
                <DroppableCategory
                  key={category.id}
                  category={category}
                  products={productsByCategory[category.id] || []}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggle={() => toggleCategory(category.id)}
                  onEditCategory={openEditCategory}
                  onDeleteCategory={confirmDeleteCategory}
                  onAddProduct={openNewProduct}
                  onEditProduct={openEditProduct}
                  onDeleteProduct={(p) => { setProductToDelete(p); setDeleteProductDialogOpen(true); }}
                  search={search}
                  isOver={overCategoryId === category.id}
                />
              ))}

              {/* Custom categories (sortable) */}
              {customCategories.map((category) => (
                <SortableCategoryWrapper key={category.id} category={category}>
                  <DroppableCategory
                    category={category}
                    products={productsByCategory[category.id] || []}
                    isExpanded={expandedCategories.has(category.id)}
                    onToggle={() => toggleCategory(category.id)}
                    onEditCategory={openEditCategory}
                    onDeleteCategory={confirmDeleteCategory}
                    onAddProduct={openNewProduct}
                    onEditProduct={openEditProduct}
                    onDeleteProduct={(p) => { setProductToDelete(p); setDeleteProductDialogOpen(true); }}
                    search={search}
                    isOver={overCategoryId === category.id}
                  />
                </SortableCategoryWrapper>
              ))}

              {/* Uncategorized products */}
              {uncategorizedProducts.length > 0 && (
                <UncategorizedDroppable
                  products={uncategorizedProducts}
                  isExpanded={expandedCategories.has('uncategorized')}
                  onToggle={() => toggleCategory('uncategorized')}
                  onEditProduct={openEditProduct}
                  onDeleteProduct={(p) => { setProductToDelete(p); setDeleteProductDialogOpen(true); }}
                  search={search}
                  isOver={overCategoryId === 'uncategorized'}
                />
              )}
            </SortableContext>

            {products.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">Nenhum produto cadastrado</p>
                <p className="text-sm text-muted-foreground">Adicione produtos ou importe via foto</p>
              </div>
            )}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeProduct && (
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-card border shadow-lg">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activeProduct.name}</p>
                </div>
                <p className="text-sm font-semibold text-primary">{formatCurrency(activeProduct.price)}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                placeholder="Nome do produto"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Estoque</Label>
                <Input
                  type="number"
                  value={productFormData.stock}
                  onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <Label>Categoria</Label>
              <Select 
                value={productFormData.category_id} 
                onValueChange={(v) => setProductFormData({ ...productFormData, category_id: v })}
              >
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
                value={productFormData.description}
                onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setProductDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveProduct}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ name: e.target.value })}
                placeholder="Nome da categoria"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCategoryDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveCategory}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={deleteProductDialogOpen} onOpenChange={setDeleteProductDialogOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Remover "{productToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Remover "{categoryToDelete?.name}"? Produtos desta categoria ficarão sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={(open) => !open && cancelPreview()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewFile?.file.type === 'application/pdf' ? (
                <FileText className="h-5 w-5 text-primary" />
              ) : (
                <ImageIcon className="h-5 w-5 text-primary" />
              )}
              Confirmar importação
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview */}
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              {previewFile?.file.type === 'application/pdf' ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <FileText className="h-16 w-16 text-primary/50" />
                  <div className="text-center">
                    <p className="font-medium text-foreground">{previewFile.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(previewFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : previewFile?.preview ? (
                <div className="relative">
                  <img 
                    src={previewFile.preview} 
                    alt="Preview do cardápio" 
                    className="w-full max-h-64 object-contain"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                    <p className="text-white text-xs truncate">{previewFile.file.name}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              A IA irá analisar o arquivo e importar automaticamente os produtos encontrados.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={cancelPreview}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={confirmAndProcessFile}>
                Importar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
