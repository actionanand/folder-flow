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

// Toggle delay dropdown for live mode
document.addEventListener('DOMContentLoaded', function() {
  var liveCheck = document.querySelector('[name="live"]');
  var delayGroup = document.getElementById('delay-group');
  if (liveCheck && delayGroup) {
    liveCheck.addEventListener('change', function() {
      delayGroup.style.display = this.checked ? 'block' : 'none';
    });
  }
});

// Share stream modal
function openShareModal(filePath, fileName) {
  document.getElementById('share-file-path').value = filePath;
  document.getElementById('share-file-name').textContent = '🎬 ' + fileName;
  document.getElementById('share-modal').classList.add('active');
}
