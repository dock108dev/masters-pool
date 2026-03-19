import { useRef, type ChangeEvent } from 'react';
import type { ClubConfig } from '../../types/domain';

interface FileUploadProps {
  clubConfig: ClubConfig;
  selectedFile: File | undefined;
  onFileSelect: (file: File | undefined) => void;
}

export function FileUpload({ clubConfig, selectedFile, onFileSelect }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (!clubConfig.uploadEnabled) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onFileSelect(file);
  };

  const handleClear = () => {
    onFileSelect(undefined);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="file-upload" data-testid="file-upload">
      <label className="file-upload-label">
        Upload Entry Form {clubConfig.uploadRequired ? '(required)' : '(optional)'}
      </label>
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        accept=".pdf,.jpg,.jpeg,.png"
        data-testid="file-input"
      />
      {selectedFile && (
        <div className="file-selected">
          <span>{selectedFile.name}</span>
          <button type="button" onClick={handleClear} className="btn-clear-file">
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
