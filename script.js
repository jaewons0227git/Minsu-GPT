/* =========================================== */
/* 🌟🌟🌟 추가 스타일 (필수) 🌟🌟🌟 */
/* =========================================== */

/* 1. 텍스트 페이드인 애니메이션 */
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}
.streaming-block > * {
    animation: fadeInUp 0.5s ease-out forwards;
}

/* 2. 비네팅 (하단 그라데이션) */
.composer-gradient-overlay {
    position: fixed; bottom: 0; left: 0; width: 100%; height: 100px;
    background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, var(--bg-color) 90%);
    pointer-events: none; z-index: 5;
    transition: background 0.3s;
}
[data-theme="dark"] .composer-gradient-overlay {
    background: linear-gradient(to bottom, rgba(18,18,18,0) 0%, var(--bg-color) 90%);
}

/* 3. 사이드바 (메뉴) 스타일 */
.sidebar-backdrop {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 2000;
    opacity: 0; visibility: hidden; transition: 0.3s;
}
.sidebar-backdrop.visible { opacity: 1; visibility: visible; }

.sidebar {
    position: fixed; top: 0; left: 0; bottom: 0;
    width: 280px; background: var(--surface-color);
    z-index: 2001;
    transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex; flex-direction: column;
    border-right: 1px solid var(--border-color);
}
.sidebar.open { transform: translateX(0); }

.sidebar-header {
    padding: 16px; border-bottom: 1px solid var(--border-color);
    display: flex; justify-content: space-between; align-items: center;
}
.sidebar-title { font-weight: 700; font-size: 18px; color: var(--text-color); }

.sidebar-actions { padding: 12px 16px; }
.new-chat-btn {
    width: 100%; padding: 12px; background: var(--primary-blue); color: white;
    border-radius: 8px; border: none; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
}

.search-container { padding: 0 16px 10px 16px; }
.search-input {
    width: 100%; padding: 10px; border-radius: 8px;
    border: 1px solid var(--border-color); background: var(--surface-secondary);
    color: var(--text-color); outline: none;
}

.chat-list { flex: 1; overflow-y: auto; padding: 10px 16px; }
.chat-list-item {
    padding: 12px; border-radius: 8px; margin-bottom: 4px; cursor: pointer;
    display: flex; justify-content: space-between; align-items: center;
    color: var(--text-color); transition: background 0.2s;
}
.chat-list-item:hover { background: var(--surface-hover); }
.chat-list-item.active { background: var(--surface-secondary); font-weight: 600; }
.chat-item-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; font-size: 14px; }
.chat-item-options { opacity: 0.5; padding: 4px; border-radius: 4px; }
.chat-list-item:hover .chat-item-options { opacity: 1; }
.chat-item-options:hover { background: rgba(0,0,0,0.1); }

.sidebar-footer {
    padding: 16px; border-top: 1px solid var(--border-color);
    display: flex; flex-direction: column; gap: 4px;
}
.sidebar-footer-btn {
    padding: 10px; border-radius: 8px; cursor: pointer; color: var(--text-sub);
    display: flex; align-items: center; gap: 8px; font-size: 14px;
}
.sidebar-footer-btn:hover { background: var(--surface-hover); color: var(--text-color); }

/* 팝오버 메뉴 */
.popover-menu {
    position: fixed; background: var(--surface-color); border: 1px solid var(--border-color);
    border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 2002;
    display: none; flex-direction: column; min-width: 120px;
}
.popover-menu.visible { display: flex; }
.popover-item { padding: 10px 16px; cursor: pointer; font-size: 14px; display: flex; gap: 8px; align-items: center; color: var(--text-color); }
.popover-item:hover { background: var(--surface-hover); }
.popover-item.danger { color: var(--error-red); }

/* 모바일 대응 */
@media (max-width: 600px) {
    .sidebar { width: 85%; }
}
