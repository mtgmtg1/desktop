import { useAuthManager } from '@/components/Context';
import { Button } from '@onlook/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@onlook/ui/dropdown-menu';
import { cn } from '@onlook/ui/utils';
import { observer } from 'mobx-react-lite';

const UserProfileDropdown = observer(
    ({ children, buttonClassName }: { children: React.ReactNode; buttonClassName?: string }) => {
        const authManager = useAuthManager();
        const initial = authManager.userMetadata?.email?.charAt(0).toUpperCase() || 'U';

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        className={cn(
                            'w-8 h-8 p-0 bg-background-onlook rounded-full focus:outline-none group text-small',
                            buttonClassName,
                        )}
                    >
                        {initial}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">{children}</DropdownMenuContent>
            </DropdownMenu>
        );
    },
);

export default UserProfileDropdown;
