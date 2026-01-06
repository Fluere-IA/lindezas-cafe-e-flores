import { Building2, ChevronDown, Plus } from 'lucide-react';
import { useOrganization, Organization } from '@/contexts/OrganizationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function OrganizationSelector() {
  const { organizations, currentOrganization, setCurrentOrganization, isMasterAdmin } = useOrganization();
  const navigate = useNavigate();

  if (organizations.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/organizacoes')}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Criar Organização
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{currentOrganization?.name || 'Selecionar'}</span>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setCurrentOrganization(org)}
            className={org.id === currentOrganization?.id ? 'bg-accent' : ''}
          >
            <Building2 className="h-4 w-4 mr-2" />
            {org.name}
          </DropdownMenuItem>
        ))}
        {isMasterAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/organizacoes')}>
              <Plus className="h-4 w-4 mr-2" />
              Gerenciar Organizações
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
