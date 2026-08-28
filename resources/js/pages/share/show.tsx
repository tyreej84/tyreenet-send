import { Head, useForm } from '@inertiajs/react';
import { Download, LockKeyhole } from 'lucide-react';
import { FormEventHandler } from 'react';

import { CategoryBadges, type CategoryTag } from '@/components/files/category-badges';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import AuthLayout from '@/layouts/auth-layout';
import { formatBytes } from '@/lib/format-bytes';

interface ShareShowProps {
    status: 'active' | 'password_required' | 'email_required' | 'code_required' | 'expired' | 'limit_reached' | 'not_found';
    file?: {
        original_name: string;
        size: number;
        categories: CategoryTag[];
    };
    download_url?: string;
    unlock_url?: string;
    request_code_url?: string;
    verify_code_url?: string;
}

export default function ShareShow({ status, file, download_url, unlock_url, request_code_url, verify_code_url }: ShareShowProps) {
    const { t } = useTranslation();
    const passwordForm = useForm({ password: '' });
    const emailForm = useForm({ email: '' });
    const codeForm = useForm({ code: '' });

    const unlock: FormEventHandler = (event) => {
        event.preventDefault();
        if (unlock_url) passwordForm.post(unlock_url);
    };

    if (status === 'email_required' && request_code_url) {
        return (
            <AuthLayout
                title={t('Verify your email')}
                description={t('This file was shared with a specific recipient. Enter that email address to request a one-time code.')}
            >
                <Head title={t('Verify your email')} />
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        emailForm.post(request_code_url);
                    }}
                    className="grid gap-4"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="share-email">{t('Email address')}</Label>
                        <Input
                            id="share-email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            value={emailForm.data.email}
                            onChange={(event) => emailForm.setData('email', event.target.value)}
                        />
                        <InputError message={emailForm.errors.email} />
                    </div>
                    <Button type="submit" disabled={emailForm.processing}>
                        {t('Send access code')}
                    </Button>
                </form>
            </AuthLayout>
        );
    }

    if (status === 'code_required' && verify_code_url) {
        return (
            <AuthLayout title={t('Enter your access code')} description={t('If the address matched, a six-digit code was sent.')}>
                <Head title={t('Enter access code')} />
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        codeForm.post(verify_code_url);
                    }}
                    className="grid gap-4"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="share-code">{t('Access code')}</Label>
                        <Input
                            id="share-code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            maxLength={6}
                            value={codeForm.data.code}
                            onChange={(event) => codeForm.setData('code', event.target.value.replace(/\D/g, ''))}
                        />
                        <InputError message={codeForm.errors.code} />
                    </div>
                    <Button type="submit" disabled={codeForm.processing}>
                        {t('Verify and continue')}
                    </Button>
                </form>
                {request_code_url && (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            emailForm.post(request_code_url);
                        }}
                        className="mt-6 grid gap-3 border-t pt-5"
                    >
                        <Label htmlFor="share-email-again">{t('Send a new code to a different email')}</Label>
                        <Input
                            id="share-email-again"
                            type="email"
                            autoComplete="email"
                            value={emailForm.data.email}
                            onChange={(event) => emailForm.setData('email', event.target.value)}
                        />
                        <InputError message={emailForm.errors.email} />
                        <Button type="submit" variant="outline" disabled={emailForm.processing}>
                            {t('Send new code')}
                        </Button>
                    </form>
                )}
            </AuthLayout>
        );
    }

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
