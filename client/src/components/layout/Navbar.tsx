import { Button } from '../ui/button';
import { ModeToggle } from '../mode-toggle';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  return (
    <nav className="border-b border-border bg-background sticky top-0 z-40">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="font-bold text-lg">Video Generate</div>
        </div>
        
        <div className="flex items-center gap-4">
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
