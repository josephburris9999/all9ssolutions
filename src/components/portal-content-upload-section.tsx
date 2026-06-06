'use client';

import { useCallback, useRef, useState } from 'react';
import { Download, FileUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PortalContentUploadItem } from '@/lib/portal-content-upload-data';
import {
  formatPortalUploadSize,
  getPortalContentUploadDownloadPath,
  PORTAL_UPLOAD_MAX_BYTES,
  PORTAL_UPLOAD_MAX_FILES_PER_REQUEST,
} from '@/lib/portal-content-upload-constants';
import { formatPortalSupportMessageTime } from '@/lib/portal-support-format';
import { PORTAL_PROJECT_AGREEMENTS_UNSIGNED_MESSAGE } from '@/lib/portal-agreement-data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalContentUploadSectionProps = {
  initialUploads: PortalContentUploadItem[];
  timeZone?: string | null;
  readOnly?: boolean;
  /** When set, downloads use the admin API for this consultation’s client. */
  consultationRequestId?: string;
  /** When set, uploads and listing are scoped to this client project. */
  projectId?: string | null;
  /** Client portal: uploads disabled until all project agreements are signed. Omit for admin views. */
  allAgreementsSigned?: boolean;
};

const ACCEPTED_TYPES =
  '.pdf,.doc,.docx,.txt,.md,.rtf,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip';

export function PortalContentUploadSection({
  initialUploads,
  timeZone,
  readOnly = false,
  consultationRequestId,
  projectId,
  allAgreementsSigned,
}: PortalContentUploadSectionProps) {
  const { toast } = useToast();
  const { isSubmitting: isUploading, runGuardedSubmit } = useSubmitGuard();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState(initialUploads);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const displayTimeZone = timeZone ?? undefined;
  const uploadEnabled = !readOnly && allAgreementsSigned !== false;

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      if (files.length > PORTAL_UPLOAD_MAX_FILES_PER_REQUEST) {
        toast({
          variant: 'destructive',
          title: 'Too many files',
          description: `Upload up to ${PORTAL_UPLOAD_MAX_FILES_PER_REQUEST} files at a time.`,
        });
        return;
      }

      await runGuardedSubmit(async () => {
        const formData = new FormData();
        for (const file of files) {
          formData.append('files', file);
        }
        if (projectId) {
          formData.append('projectId', projectId);
        }

        const res = await fetch('/api/portal/content-uploads', {
          method: 'POST',
          body: formData,
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          uploads?: PortalContentUploadItem[];
          errors?: string[];
        };

        if (!res.ok || !data.ok) {
          toast({
            variant: 'destructive',
            title: 'Upload failed',
            description: data.error ?? 'Please try again.',
          });
          return;
        }

        if (data.uploads?.length) {
          setUploads((current) => [...data.uploads!, ...current]);
          toast({
            title: data.uploads.length === 1 ? 'File uploaded' : 'Files uploaded',
            description: `${data.uploads.length} file(s) shared with all9s Solutions.`,
          });
        }

        if (data.errors?.length) {
          toast({
            variant: 'destructive',
            title: 'Some files were skipped',
            description: Array.isArray(data.errors) ? data.errors.join(' ') : 'Some files could not be uploaded.',
          });
        }

        setPendingFiles([]);
      }).catch(() => {
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: 'Please check your connection and try again.',
        });
      });
    },
    [runGuardedSubmit, toast]
  );

  function handleFileSelection(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setPendingFiles(files);
    void uploadFiles(files);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!uploadEnabled || isUploading) {
      return;
    }
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (!uploadEnabled || isUploading) return;
    handleFileSelection(event.dataTransfer.files);
  }

  const sectionTitle = readOnly ? 'Uploaded Documents' : 'Share Documents';

  return (
    <section className="mt-12 max-w-3xl" aria-labelledby="portal-content-upload-heading">
      <h2
        id="portal-content-upload-heading"
        className={cn('text-2xl font-bold text-foreground', readOnly ? 'mb-6' : 'mb-2')}
      >
        {sectionTitle}
      </h2>
      {!readOnly ? (
        <p className="mb-6 text-sm text-muted-foreground">
          Upload documents, images, or archives for your project. Maximum{' '}
          {formatPortalUploadSize(PORTAL_UPLOAD_MAX_BYTES)} per file.
        </p>
      ) : null}

      {!readOnly && allAgreementsSigned === false ? (
        <p className="mb-6 text-sm text-muted-foreground">{PORTAL_PROJECT_AGREEMENTS_UNSIGNED_MESSAGE}</p>
      ) : null}

      {uploadEnabled ? (
        <>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && inputRef.current?.click()}
            className={cn(
              'mb-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors',
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-border bg-background/80 hover:border-primary/50 hover:bg-muted/20',
              isUploading && 'pointer-events-none opacity-60'
            )}
            aria-label="Drag and drop files here or click to browse"
          >
            <Upload className="mb-4 size-10 text-primary" aria-hidden />
            <p className="text-base font-medium text-foreground">
              {isUploading ? 'Uploading…' : 'Drag and drop files here'}
            </p>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              or click to browse. PDF, Word, text, images, and ZIP up to{' '}
              {formatPortalUploadSize(PORTAL_UPLOAD_MAX_BYTES)} each.
            </p>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              multiple
              accept={ACCEPTED_TYPES}
              disabled={isUploading}
              onChange={(event) => {
                handleFileSelection(event.target.files);
                event.target.value = '';
              }}
            />
          </div>

          {pendingFiles.length > 0 && isUploading ? (
            <p className="mb-4 text-sm text-muted-foreground">
              Uploading {pendingFiles.length} file{pendingFiles.length === 1 ? '' : 's'}…
            </p>
          ) : null}

          <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              className="w-full"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-4" aria-hidden />
              Choose Files
            </Button>
          </div>
        </>
      ) : null}

      <div className="space-y-3" aria-label="Uploaded files">
        {!readOnly ? <h3 className="text-sm font-semibold text-foreground">Your uploads</h3> : null}
        {uploads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {uploads.map((upload) => (
              <li
                key={upload.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <FileUp className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{upload.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPortalUploadSize(upload.sizeBytes)} ·{' '}
                    <time dateTime={upload.createdAt}>
                      {formatPortalSupportMessageTime(upload.createdAt, displayTimeZone)}
                    </time>
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0" asChild>
                  <a
                    href={getPortalContentUploadDownloadPath(upload.id, consultationRequestId)}
                    download={upload.fileName}
                    title={`Download ${upload.fileName}`}
                  >
                    <Download className="size-4" aria-hidden />
                    <span className="sr-only">Download {upload.fileName}</span>
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
