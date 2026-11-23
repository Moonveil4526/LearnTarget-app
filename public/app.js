// State global aplikasi di Frontend
let allTargets = [];
let currentStatusFilter = 'Semua';
let currentSearchQuery = '';

//Jalankan saat halaman pertama kali dibuka
document.addEventListener('DOMContentLoaded', () => {
  fetchTargets();
});

// [GET] Ambil semua data dari Backend Express (/api/targets)
async function fetchTargets() {
  const loadingEl = document.getElementById('loading-state');
  const gridEl = document.getElementById('targets-grid');

  try {
    loadingEl.classList.remove('hidden');
    gridEl.innerHTML = '';

    const response = await fetch('/api/targets');
    if (!response.ok) throw new Error('Gagal mengambil data dari server');

    allTargets = await response.json();
    updateDashboardStats(allTargets);
    renderTargets();
  } catch (error) {
    console.error(error);
    gridEl.innerHTML = `
      <div class="col-span-full bg-red-950/50 border border-red-800 text-red-200 p-4 rounded-xl text-sm">
        Gagal memuat data target belajar: ${error.message}
      </div>
    `;
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// Hitung dan update angka di 4 kartu statistik & Progress Bar
function updateDashboardStats(targets) {
  const total = targets.length;
  const pending = targets.filter(t => t.status === 'Belum Mulai').length;
  const inProgress = targets.filter(t => t.status === 'Sedang Dipelajari').length;
  const done = targets.filter(t => t.status === 'Selesai').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-progress').textContent = inProgress;
  document.getElementById('stat-done').textContent = done;

  const percentage = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById('progress-percentage').textContent = `${percentage}%`;
  document.getElementById('progress-bar').style.width = `${percentage}%`;
}

//Render daftar kartu target belajar sesuai filter & pencarian
function renderTargets() {
  const gridEl = document.getElementById('targets-grid');
  const emptyEl = document.getElementById('empty-state');

  const filtered = allTargets.filter(item => {
    const matchStatus = currentStatusFilter === 'Semua' || item.status === currentStatusFilter;
    const query = currentSearchQuery.toLowerCase();
    const matchSearch =
      item.title.toLowerCase().includes(query) ||
      item.subject.toLowerCase().includes(query) ||
      (item.notes && item.notes.toLowerCase().includes(query));

    return matchStatus && matchSearch;
  });

  if (filtered.length === 0) {
    gridEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  gridEl.innerHTML = filtered.map(target => {
    // Badge warna Prioritas
    const priorityBadge = {
      High: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      Low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    }[target.priority] || 'bg-slate-800 text-slate-300';

    // Badge warna Status
    const statusBadge = {
      'Belum Mulai': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'Sedang Dipelajari': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      'Selesai': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    }[target.status] || 'bg-slate-800 text-slate-300';

    // Format Tanggal Deadline
    const formattedDate = target.target_date
      ? new Date(target.target_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : 'Tanpa Deadline';

    const isDone = target.status === 'Selesai';

    return `
      <article class="bg-slate-900/90 border ${isDone ? 'border-emerald-500/30' : 'border-slate-800'} hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-lg">
        <div>
          <!-- Baris Atas: Kategori Mata Pelajaran & Prioritas -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg truncate">
              📘 ${escapeHTML(target.subject)}
            </span>
            <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${priorityBadge}">
              ${escapeHTML(target.priority)}
            </span>
          </div>

          <!-- Judul Target Belajar -->
          <h3 class="text-base sm:text-lg font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'} leading-snug">
            ${escapeHTML(target.title)}
          </h3>

          <!-- Catatan -->
          <p class="mt-2 text-xs sm:text-sm text-slate-400 line-clamp-2">
            ${target.notes ? escapeHTML(target.notes) : '<span class="italic text-slate-600">Tidak ada catatan tambahan</span>'}
          </p>
        </div>

        <!-- Bagian Bawah Kartu: Tanggal, Status & Tombol Aksi -->
        <div class="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 flex items-center gap-1.5">
              📅 <span>${formattedDate}</span>
            </span>
            <span class="px-2.5 py-1 rounded-lg font-semibold border ${statusBadge}">
              ${escapeHTML(target.status)}
            </span>
          </div>

          <!-- Tombol Interaksi Cepat -->
          <div class="flex items-center justify-between gap-2 pt-1">
            <!-- Dropdown Ganti Status Cepat -->
            <select
              onchange="quickUpdateStatus(${target.id}, this.value)"
              class="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Belum Mulai" ${target.status === 'Belum Mulai' ? 'selected' : ''}>⏳ Belum Mulai</option>
              <option value="Sedang Dipelajari" ${target.status === 'Sedang Dipelajari' ? 'selected' : ''}>🔥 Dipelajari</option>
              <option value="Selesai" ${target.status === 'Selesai' ? 'selected' : ''}>✅ Selesai</option>
            </select>

            <!-- Tombol Edit -->
            <button
              onclick="openEditModal(${target.id})"
              title="Edit Target"
              class="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </button>

            <!-- Tombol Hapus -->
            <button
              onclick="deleteTarget(${target.id})"
              title="Hapus Target"
              class="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

//[POST / PUT] Simpan Target Baru atau Update Target ke Backend
async function handleFormSubmit(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('submit-btn');
  const id = document.getElementById('target-id').value;

  const payload = {
    title: document.getElementById('title').value,
    subject: document.getElementById('subject').value,
    priority: document.getElementById('priority').value,
    status: document.getElementById('status').value,
    target_date: document.getElementById('target_date').value || null,
    notes: document.getElementById('notes').value
  };

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    const url = id ? `/api/targets/${id}` : '/api/targets';
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Gagal menyimpan data');

    closeModal();
    await fetchTargets();
  } catch (error) {
    alert('Terjadi kesalahan: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Simpan Target';
  }
}

//[PATCH] Update Cepat Status Belajar
async function quickUpdateStatus(id, newStatus) {
  try {
    const response = await fetch(`/api/targets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error('Gagal mengubah status');
    await fetchTargets();
  } catch (error) {
    alert('Gagal update status: ' + error.message);
  }
}

//[DELETE] Hapus Target Belajar
async function deleteTarget(id) {
  const confirmDelete = confirm('Yakin ingin menghapus target belajar ini?');
  if (!confirmDelete) return;

  try {
    const response = await fetch(`/api/targets/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Gagal menghapus target');
    await fetchTargets();
  } catch (error) {
    alert('Gagal menghapus: ' + error.message);
  }
}

// Fungsi Filter & Search
function setFilterStatus(status) {
  currentStatusFilter = status;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.status === status) {
      btn.className = 'filter-btn whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white transition';
    } else {
      btn.className = 'filter-btn whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition';
    }
  });
  renderTargets();
}

function handleSearch(query) {
  currentSearchQuery = query;
  renderTargets();
}

// Fungsi Buka/Tutup Modal Form
function openModal() {
  document.getElementById('target-form').reset();
  document.getElementById('target-id').value = '';
  document.getElementById('modal-title').textContent = 'Tambah Target Belajar Baru';
  const modal = document.getElementById('target-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function openEditModal(id) {
  const target = allTargets.find(t => t.id === id);
  if (!target) return;

  document.getElementById('target-id').value = target.id;
  document.getElementById('title').value = target.title;
  document.getElementById('subject').value = target.subject;
  document.getElementById('priority').value = target.priority;
  document.getElementById('status').value = target.status;
  document.getElementById('target_date').value = target.target_date ? target.target_date.split('T')[0] : '';
  document.getElementById('notes').value = target.notes || '';

  document.getElementById('modal-title').textContent = 'Edit Target Belajar';
  const modal = document.getElementById('target-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeModal() {
  const modal = document.getElementById('target-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// Helper anti-XSS
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag]));
}
