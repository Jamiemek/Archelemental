// small shared bits: the game's dialog, escaping text for HTML, status lines
function openDialog(html) {
    closeDialog();
    const wrap = document.createElement('div');
    wrap.className = 'dlg-wrap';
    wrap.id = 'dlg';
    wrap.innerHTML = '<div class="dlg" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(wrap);
    return wrap;
}
function closeDialog() {
    const d = $('dlg');
    if (d) {
        d.remove();
    }
}
const rnd = Math.random;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function setMsg(id, text, bad) {
    const el = $(id);
    if (el) {
        el.textContent = text;
        el.classList.toggle('bad', !!bad);
    }
}
