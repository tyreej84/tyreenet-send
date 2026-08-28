import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormatDate } from '@/hooks/use-format-date';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { usePasskeyRegister } from '@laravel/passkeys/react';
import { KeyRound, LoaderCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface PasskeyEntry {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string | null;
}

export default function PasskeysPage({ passkeys }: { passkeys: PasskeyEntry[] }) {
    const { t } = useTranslation();
    const { dateTime } = useFormatDate();
    const [name, setName] = useState('');
    const registration = usePasskeyRegister({
        onSuccess: () => {
            setName('');
            router.reload();
        },
    });
    const breadcrumbs: BreadcrumbItem[] = [{ title: t('Passkeys'), href: '/settings/passkeys' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Passkeys')} />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title={t('Passkeys')} description={t('Sign in securely with your device, fingerprint, face, or security key.')} />
                    <div className="space-y-3 rounded-md border p-4">
                        <Label htmlFor="passkey-name">{t('Device name')}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="passkey-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder={t('Personal laptop')}
                            />
                            <Button
                                disabled={!name.trim() || registration.isLoading || !registration.isSupported}
                                onClick={() => registration.register(name.trim())}
                            >
                                {registration.isLoading ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                                {t('Add passkey')}
                            </Button>
                        </div>
                        {!registration.isSupported && <p className="text-muted-foreground text-sm">{t('This browser does not support passkeys.')}</p>}
                        {registration.error && <p className="text-destructive text-sm">{registration.error}</p>}
                    </div>
                    <div className="divide-y rounded-md border">
                        {passkeys.length === 0 ? (
                            <p className="text-muted-foreground p-4 text-sm">{t('No passkeys registered yet.')}</p>
                        ) : (
                            passkeys.map((passkey) => (
                                <div key={passkey.id} className="flex items-center justify-between gap-4 p-4">
                                    <div>
                                        <p className="font-medium">{passkey.name}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {passkey.last_used_at
                                                ? t('Last used :date', { date: dateTime(passkey.last_used_at) })
                                                : t('Not used yet')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => router.delete(`/user/passkeys/${passkey.id}`)}
                                        aria-label={t('Delete passkey')}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t(
                            'Your password and two-factor recovery methods remain available. Register at least two passkeys before relying on them while traveling.',
                        )}
                    </p>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
