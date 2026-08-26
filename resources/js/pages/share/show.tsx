import { Head, useForm } from '@inertiajs/react';
import { Download, LockKeyhole } from 'lucide-react';
import { FormEventHandler } from 'react';

import { CategoryBadges, type CategoryTag } from '@/components/files/category-badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { useTranslation } from '@/hooks/use-translation';
import AuthLayout from '@/layouts/auth-layout';
import { formatBytes } from '@/lib/format-bytes';

interface ShareShowProps {
    status: 'active' | 'password_required' | 'expired' | 'limit_reached' | 'not_found';
    file?: {
        original_name: string;
        size: number;
        categories: CategoryTag[];
    };
    download_url?: string;
    unlock_url?: string;
}

export default function ShareShow({ status, file, download_url, unlock_url }: ShareShowProps) {
    const { t } = useTranslation();
    const passwordForm = useForm({ password: '' });

    const unlock: FormEventHandler = (event) => {
        event.preventDefault();
        if (unlock_url) passwordForm.post(unlock_url);
    };

    if (status === 'password_required' && unlock_url) {
        return (
            <AuthLayout title={t('Protected file')} description={t('Enter the password provided by the sender to continue.')}>
                <Head title={t('Protected file')} />
                <form onSubmit={unlock} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="share-password">{t('Password')}</Label>
                        <Input
                            id="share-password"
                            type="password"
                            autoComplete="current-password"
                            autoFocus
                            value={passwordForm.data.password}
                            onChange={(event) => passwordForm.setData('password', event.target.value)}
                        />
                        <InputError message={passwordForm.errors.password} />
                    </div>
                    <Button type="submit" disabled={passwordForm.processing}>
                        <LockKeyhole className="size-4" /> {t('Unlock file')}
                    </Button>
                </form>
            </AuthLayout>
        );
    }

    if (status !== 'active' || !file || !download_url) {
        const description =
            status === 'expired'
                ? t('This link has expired.')
                : status === 'limit_reached'
                  ? t('This link has reached its download limit.')
                  : t("This link doesn't exist or has been revoked.");

        return (
            <AuthLayout title={t('Link unavailable')} description={description}>
                <Head title={t('Link unavailable')} />
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title={file.original_name} description={formatBytes(file.size)}>
            <Head title={file.original_name} />

            <CategoryBadges categories={file.categories} className="mb-4 justify-center" />

            <Button asChild className="w-full">
                <a href={download_url}>
                    <Download className="size-4" /> {t('Download')}
                </a>
            </Button>
            <p className="text-muted-foreground mt-4 text-center text-xs">{t('Privately hosted and delivered by TyreeNet.')}</p>
        </AuthLayout>
    );
}
