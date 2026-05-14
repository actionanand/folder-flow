// Drag & drop enhancement
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const preview = document.getElementById('file-preview');

  if (!dropZone) return;

  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    fileInput.files = e.dataTransfer.files;
    showPreview(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', () => {
    showPreview(fileInput.files);
  });

  function showPreview(files) {
    if (!preview) return;
    const names = Array.from(files).map(f => f.name);
    preview.textContent = names.length > 0
      ? `${names.length} file(s): ${names.join(', ')}`
      : '';
  }
});
