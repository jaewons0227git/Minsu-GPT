document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
document.onkeydown = function(e) {
  if (e.keyCode == 123) { e.preventDefault(); return false; } 
  if (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0) || e.keyCode == 'C'.charCodeAt(0))) { e.preventDefault(); return false; } 
  if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) { e.preventDefault(); return false; } 
};

// ===========================================
// 1. DOM 요소 및 상수 정의
// ===========================================

const phone = document.querySelector('.phone');
const contentWrapper = document.getElementById('content-wrapper');
const inputField = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const stopButton = document.getElementById('stop-button');
const initialContent = document.getElementById('initial-content');
const chatMessages = document.getElementById('chat-messages');
const composer = document.getElementById('composer');
const inputContainer = document.getElementById('input-container');
const plusButton = document.getElementById('plus-button');
const plusModalBackdrop = document.getElementById('plus-modal-backdrop');
const settingsButton = document.getElementById('settings-button');
const settingsModalBackdrop = document.getElementById('settings-modal-backdrop');
const resetChatButton = document.getElementById('reset-chat-button');
const quickActionButtons = document.querySelectorAll('.quick-action-button');
const nameInputModalBackdrop = document.getElementById('name-input-modal-backdrop');
const nameInput = document.getElementById('nameInput');
const nameSubmitBtn = document.getElementById('nameSubmitBtn');
const aboutButton = document.getElementById('about-button');
const aboutModalBackdrop = document.getElementById('about-modal-backdrop');
const modeToggleCheckbox = document.getElementById('modeToggleCheckbox');
const resetConfirmModalBackdrop = document.getElementById('reset-confirm-modal-backdrop');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const confirmResetBtn = document.getElementById('confirm-reset-btn');
const scrollDownButton = document.getElementById('scrollDownButton'); 

// 🌟 [추가] 메뉴 관련 DOM 요소 정의
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const sideMenuOverlay = document.getElementById('sideMenuOverlay');
const chatListContainer = document.getElementById('chatListContainer');
const newChatMenuBtn = document.getElementById('newChatMenuBtn');
const resetAllMenuBtn = document.getElementById('resetAllMenuBtn');
const locationDisplay = document.getElementById('locationDisplay');


// 상태 변수
let isStreaming = false;
let currentConversationId = null;
let conversations = {};
let autoScrollEnabled = true;

// 로컬 스토리지에서 사용자 이름 로드
let username = localStorage.getItem('username');
if (username === 'ADMIN') {
    username = '관리자'; 
}


// ===========================================
// 2. UI 및 설정 (테마, 스타일, 모달) 관련 함수
// ===========================================

/**
 * 메시지 컨테이너를 맨 아래로 스크롤합니다.
 * @param {boolean} smooth - 스무스 스크롤 여부
 */
function scrollToBottom(smooth = false) {
    if (contentWrapper) {
        contentWrapper.scrollTo({
            top: contentWrapper.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }
}

/**
 * 채팅 제목을 업데이트합니다.
 */
function updateTitle() {
    const titleText = username ? `${username}의 MinsuGPT` : 'MinsuGPT';
    document.title = titleText;
    const logoElement = document.querySelector('.header-logo');
    if (logoElement) {
        logoElement.textContent = titleText;
    }
}

/**
 * 새 대화 항목을 렌더링하고 채팅 목록에 추가합니다.
 * @param {string} id - 대화 ID
 * @param {string} title - 대화 제목
 * @param {boolean} isActive - 현재 활성 대화인지 여부
 */
function renderChatItem(id, title, isActive) {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-item ${isActive ? 'active' : ''}`;
    chatItem.dataset.id = id;
    
    // 제목
    const titleSpan = document.createElement('span');
    titleSpan.className = 'chat-item-text';
    titleSpan.textContent = title;
    
    // 삭제 버튼
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-chat-btn material-symbols-rounded';
    deleteBtn.textContent = 'delete';
    deleteBtn.title = '대화 삭제';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 제목 클릭 이벤트 방지
        confirmDeleteChat(id);
    });

    chatItem.appendChild(titleSpan);
    chatItem.appendChild(deleteBtn);
    
    chatItem.addEventListener('click', () => {
        // 현재 활성 대화가 아니면 전환
        if (currentConversationId !== id) {
            switchConversation(id);
            if (window.innerWidth < 1024) {
                toggleMenu(false); // 모바일에서 대화 전환 후 메뉴 닫기
            }
        }
    });

    chatListContainer.prepend(chatItem);
}

/**
 * 모든 대화 항목을 다시 렌더링하고 활성 상태를 설정합니다.
 */
function renderChatList() {
    chatListContainer.innerHTML = '';
    const conversationKeys = Object.keys(conversations).sort().reverse();

    if (conversationKeys.length === 0) {
        // 새 대화 시작 (대화가 하나도 없을 때)
        startNewConversation(false); 
        return;
    }

    conversationKeys.forEach(id => {
        const conv = conversations[id];
        const isActive = id === currentConversationId;
        renderChatItem(id, conv.title, isActive);
    });

    // 현재 활성 대화가 목록에 없다면 (예: 삭제 후)
    if (!currentConversationId || !conversations[currentConversationId]) {
        // 가장 최근 대화로 전환
        switchConversation(conversationKeys[0]);
    }
}

// 🌟 [추가] 메뉴 토글 함수
function toggleMenu(show) {
    const isPC = window.innerWidth >= 1024;
    
    if (show === undefined) {
        // 현재 상태 반전
        show = !sideMenu.classList.contains('open');
    }
    
    if (show) {
        sideMenu.classList.add('open');
        document.body.classList.add('menu-open'); // PC 콘텐츠 밀기 및 모바일 스크롤 방지
        if (!isPC) {
            sideMenuOverlay.classList.add('open'); // 모바일에서만 오버레이 표시
        }
    } else {
        sideMenu.classList.remove('open');
        document.body.classList.remove('menu-open'); 
        if (!isPC) {
            sideMenuOverlay.classList.remove('open');
        }
    }
}


/**
 * 테마 전환 함수
 * @param {string} theme - 'light' 또는 'dark'
 */
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // meta theme color 업데이트 (모바일 브라우저 주소창 색상)
    const metaThemeColor = document.getElementById('meta-theme-color');
    const surfaceColor = getComputedStyle(document.body).getPropertyValue('--surface-color').trim();
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', surfaceColor);
    }
}

/**
 * 설정 모달 토글
 * @param {boolean} show - 표시 여부
 */
function toggleSettingsModal(show) {
    if (show === undefined) { settingsModalBackdrop.classList.toggle('visible'); } 
    else if (show) { settingsModalBackdrop.classList.add('visible'); } 
    else { settingsModalBackdrop.classList.remove('visible'); }
}

/**
 * 플러스 모달 토글
 * @param {boolean} show - 표시 여부
 */
function togglePlusModal(show) {
    if (show === undefined) { plusModalBackdrop.classList.toggle('visible'); } 
    else if (show) { plusModalBackdrop.classList.add('visible'); } 
    else { plusModalBackdrop.classList.remove('visible'); }
}

/**
 * 정보 모달 토글
 * @param {boolean} show - 표시 여부
 */
function toggleAboutModal(show) {
    if (show === undefined) { aboutModalBackdrop.classList.toggle('visible'); } 
    else if (show) { aboutModalBackdrop.classList.add('visible'); } 
    else { aboutModalBackdrop.classList.remove('visible'); }

    if (show) toggleSettingsModal(false); 
}

/**
 * 이름 입력 모달 토글
 * @param {boolean} show - 표시 여부
 */
function toggleNameInputModal(show) {
    if (show === undefined) { nameInputModalBackdrop.classList.toggle('visible'); } 
    else if (show) { nameInputModalBackdrop.classList.add('visible'); } 
    else { nameInputModalBackdrop.classList.remove('visible'); }
    
    if (show) {
        nameInput.focus();
        // 모달이 보일 때 스크롤 방지
        document.body.style.overflow = 'hidden'; 
    } else {
        document.body.style.overflow = '';
    }
}

// ===========================================
// 3. 메시지 렌더링 관련 함수
// ===========================================

/**
 * 메시지 객체로부터 HTML 요소를 생성합니다.
 * @param {object} message - 메시지 객체 { role, content, id }
 * @param {string} conversationId - 대화 ID
 * @returns {HTMLElement} 메시지 컨테이너 요소
 */
function createMessageElement(message, conversationId) {
    const container = document.createElement('div');
    container.className = `message-container ${message.role}-message-container`;
    container.dataset.messageId = message.id;
    container.dataset.conversationId = conversationId;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = message.role === 'user' ? (username ? username[0] : 'U') : 'M';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // AI 메시지는 Markdown을 HTML로 변환
    if (message.role === 'model') {
        contentDiv.innerHTML = marked.parse(message.content);
    } else {
        contentDiv.textContent = message.content;
    }

    container.appendChild(avatar);
    container.appendChild(contentDiv);

    return container;
}

/**
 * 현재 활성 대화의 메시지를 화면에 렌더링합니다.
 */
function renderActiveChat() {
    chatMessages.innerHTML = ''; // 기존 메시지 모두 지우기
    initialContent.style.display = 'none';
    
    if (currentConversationId && conversations[currentConversationId]) {
        const messages = conversations[currentConversationId].messages;
        
        if (messages.length === 0) {
            initialContent.style.display = 'flex';
        } else {
            messages.forEach(message => {
                const element = createMessageElement(message, currentConversationId);
                chatMessages.appendChild(element);
            });
        }
    } else {
        initialContent.style.display = 'flex';
    }

    scrollToBottom();
}

/**
 * 응답 스트리밍 중일 때 화면에 메시지 내용을 추가합니다.
 * @param {string} newText - 스트리밍된 새 텍스트
 */
function updateStreamingMessage(newText) {
    let lastAiMessageElement = chatMessages.lastElementChild;
    let contentDiv;

    // 마지막 요소가 AI 메시지 컨테이너인지 확인
    if (lastAiMessageElement && lastAiMessageElement.classList.contains('model-message-container')) {
        contentDiv = lastAiMessageElement.querySelector('.message-content');
    }

    // AI 메시지가 없거나, 스트리밍이 새로 시작된 경우 새 메시지 요소 생성
    if (!contentDiv) {
        const newMessage = {
            role: 'model',
            content: newText,
            id: Date.now() 
        };
        lastAiMessageElement = createMessageElement(newMessage, currentConversationId);
        chatMessages.appendChild(lastAiMessageElement);
        contentDiv = lastAiMessageElement.querySelector('.message-content');
    }

    // Markdown을 HTML로 변환하여 업데이트
    contentDiv.innerHTML = marked.parse(newText);
    
    // 자동 스크롤 활성화 상태일 때만 스크롤
    if (autoScrollEnabled) {
        scrollToBottom();
    }
}

/**
 * 타이핑 인디케이터를 토글합니다.
 * @param {boolean} show - 표시 여부
 */
function toggleTypingIndicator(show) {
    let indicator = document.getElementById('typing-indicator');
    
    if (show) {
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'typing-indicator';
            indicator.className = 'typing-indicator model-message-container'; // AI 메시지 컨테이너 스타일 사용
            indicator.innerHTML = `
                <div class="message-avatar" style="margin-right: 12px;">M</div>
                <div class="message-content" style="padding: 10px 14px; border-bottom-left-radius: 4px; display: flex; align-items: center; gap: 4px;">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            `;
            chatMessages.appendChild(indicator);
        }
        indicator.style.display = 'flex';
        scrollToBottom();
    } else {
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    // 스트리밍 중이 아닐 때만 스크롤 버튼 표시 여부 업데이트
    if (!isStreaming) {
        handleScrollButtonVisibility();
    }
}


// ===========================================
// 4. 대화 관리 (로컬 스토리지) 함수
// ===========================================

/**
 * 모든 대화를 로컬 스토리지에서 로드합니다.
 */
function loadAllConversations() {
    try {
        const storedConversations = localStorage.getItem('conversations');
        if (storedConversations) {
            conversations = JSON.parse(storedConversations);
        }
        
        const storedCurrentId = localStorage.getItem('currentConversationId');
        
        // 유효한 대화 ID가 있고, 해당 대화가 목록에 있으면 사용
        if (storedCurrentId && conversations[storedCurrentId]) {
            currentConversationId = storedCurrentId;
        } else if (Object.keys(conversations).length > 0) {
            // 없으면 가장 최근 대화(가장 큰 ID)를 현재 대화로 설정
            currentConversationId = Object.keys(conversations).sort().reverse()[0];
        }

    } catch (e) {
        console.error("Failed to load conversations:", e);
        conversations = {};
        currentConversationId = null;
    }

    renderChatList();
    renderActiveChat();
}

/**
 * 모든 대화를 로컬 스토리지에 저장합니다.
 */
function saveAllConversations() {
    try {
        localStorage.setItem('conversations', JSON.stringify(conversations));
        localStorage.setItem('currentConversationId', currentConversationId);
    } catch (e) {
        console.error("Failed to save conversations:", e);
    }
}

/**
 * 새 대화를 시작하고 활성화합니다.
 * @param {boolean} isUserAction - 사용자 메뉴 클릭 등에 의한 시작인지 (true면 즉시 활성화)
 */
function startNewConversation(isUserAction = true) {
    const newId = Date.now().toString();
    const newConv = {
        title: '새 대화',
        messages: []
    };
    
    conversations[newId] = newConv;
    
    if (isUserAction || !currentConversationId) {
        currentConversationId = newId;
    }
    
    saveAllConversations();
    renderChatList();
    if (isUserAction) {
        renderActiveChat();
        inputField.focus();
    }
}

/**
 * 대화를 전환합니다.
 * @param {string} newId - 전환할 대화 ID
 */
function switchConversation(newId) {
    if (isStreaming) {
        alert('응답을 생성 중입니다. 잠시 후 시도해주세요.');
        return;
    }
    
    currentConversationId = newId;
    saveAllConversations();
    renderChatList(); // 활성 상태 업데이트
    renderActiveChat();
    inputField.focus();
}

/**
 * 현재 대화에 메시지를 추가하고 저장합니다.
 * @param {object} message - 추가할 메시지 객체 { role, content }
 */
function addMessageToCurrentChat(message) {
    if (!currentConversationId || !conversations[currentConversationId]) {
        // 대화가 없으면 새 대화를 시작하고 메시지를 추가
        startNewConversation(false);
    }
    
    const messages = conversations[currentConversationId].messages;
    
    // 새 메시지 객체 생성 (ID 추가)
    const newMessage = {
        ...message,
        id: Date.now() + messages.length 
    };

    messages.push(newMessage);
    
    // 첫 메시지인 경우 제목 자동 생성 (미구현 - 여기서는 첫 사용자 메시지로 설정)
    if (messages.length === 1 && message.role === 'user') {
        let newTitle = message.content.substring(0, 30);
        if (message.content.length > 30) {
            newTitle += '...';
        }
        conversations[currentConversationId].title = newTitle;
        renderChatList(); // 제목 업데이트 반영
    }
    
    saveAllConversations();
}

/**
 * 전체 대화를 영구적으로 삭제할지 확인하는 모달을 띄웁니다.
 */
function confirmResetAllChats() {
    toggleResetConfirmModal(true);
}

/**
 * 특정 대화를 삭제합니다.
 * @param {string} id - 삭제할 대화 ID
 */
function deleteChat(id) {
    delete conversations[id];
    
    if (currentConversationId === id) {
        currentConversationId = null;
    }
    
    saveAllConversations();
    renderChatList();
    renderActiveChat();
}

/**
 * 대화 삭제를 확인하는 모달을 띄웁니다. (개별 채팅 항목)
 * @param {string} id - 삭제할 대화 ID
 */
function confirmDeleteChat(id) {
    const chatToDelete = conversations[id];
    if (!chatToDelete) return;
    
    const confirmMessage = `${chatToDelete.title} 대화를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`;
    
    if (confirm(confirmMessage)) {
        deleteChat(id);
    }
}

// ===========================================
// 5. 핵심 로직 (메시지 전송 및 처리)
// ===========================================

/**
 * 메시지 전송 버튼 및 입력창 상태를 업데이트합니다.
 */
function updateComposerState() {
    const inputEmpty = inputField.value.trim() === '';
    
    inputField.disabled = isStreaming;
    sendButton.disabled = inputEmpty || isStreaming;
    stopButton.style.display = isStreaming ? 'flex' : 'none';
    
    if (isStreaming) {
        sendButton.style.display = 'none';
        stopButton.classList.add('visible');
        toggleTypingIndicator(true);
        plusButton.disabled = true;
    } else {
        sendButton.style.display = 'flex';
        stopButton.classList.remove('visible');
        toggleTypingIndicator(false);
        plusButton.disabled = false;
    }
    
    // textarea 높이 자동 조절
    inputField.style.height = 'auto';
    inputField.style.height = inputField.scrollHeight + 'px';
}

/**
 * 가상으로 AI 응답을 스트리밍합니다.
 * @param {string} userMessage - 사용자 메시지
 */
async function streamAIResponse(userMessage) {
    isStreaming = true;
    updateComposerState();
    
    // 1. 사용자 메시지 추가 및 렌더링
    addMessageToCurrentChat({ role: 'user', content: userMessage });
    const userElement = createMessageElement({ role: 'user', content: userMessage }, currentConversationId);
    chatMessages.appendChild(userElement);
    scrollToBottom();
    
    // 2. 응답 메시지 초기화
    let fullResponse = '';
    addMessageToCurrentChat({ role: 'model', content: fullResponse }); 
    
    // 3. 응답 스트리밍 (가상)
    const mockResponseText = `안녕하세요, **${username}**님! 당신이 방금 물어본 "${userMessage}"에 대한 답변입니다. 저는 MinsuGPT입니다.

저는 현재 백엔드가 구현되지 않은 **프론트엔드 모의 채팅** 인터페이스로 작동하고 있습니다.

### 주요 기능 요약

1.  **반응형 UI**: 모바일과 PC 환경에 따라 레이아웃이 유동적으로 변화합니다.
2.  **사이드 메뉴**: PC에서는 기본적으로 표시되고, 모바일에서는 토글됩니다. (요청하신 기능)
3.  **대화 기록**: 로컬 스토리지를 사용하여 대화 기록이 저장됩니다.
4.  **스트리밍 모방**: 실제 API 호출은 없지만, 응답을 타이핑하는 것처럼 보이게 처리합니다.

\`\`\`javascript
// 실제 로직은 여기에 들어갑니다.
function actualAIRequest(prompt) {
    // API 호출 및 실시간 응답 처리
    return "실제 AI 응답 데이터"; 
}
\`\`\`

이 코드는 순수 JavaScript, HTML, CSS로 작성되었습니다. 저는 당신의 입력에 대해 **${new Date().toLocaleString('ko-KR')}** 시점에 응답을 드렸습니다.

> 추가적으로, 현재 위치는 ${locationDisplay.textContent}입니다.

감사합니다!`;
    
    const words = mockResponseText.split(/([ \n])/); // 공백과 줄바꿈을 구분자로 유지
    
    const lastAiMessageIndex = conversations[currentConversationId].messages.length - 1;
    let accumulatedText = conversations[currentConversationId].messages[lastAiMessageIndex].content;

    for (const word of words) {
        if (!isStreaming) break; // 사용자가 중단 버튼을 누르면 종료
        
        accumulatedText += word;
        
        // 메시지 객체 업데이트 (로컬 스토리지에 저장되는 내용)
        conversations[currentConversationId].messages[lastAiMessageIndex].content = accumulatedText;
        
        // 화면 업데이트
        updateStreamingMessage(accumulatedText); 
        
        // 딜레이 설정 (줄바꿈이 아닌 경우에만 딜레이를 주어 빠르게 보이게 함)
        await new Promise(resolve => setTimeout(resolve, word === '\n' ? 10 : 15));
    }

    // 4. 응답 완료 후 처리
    isStreaming = false;
    updateComposerState();
    saveAllConversations();
    scrollToBottom(true);
}

/**
 * 메시지 전송 처리를 담당합니다.
 */
function sendMessage() {
    if (isStreaming) return;
    
    const message = inputField.value.trim();
    if (message === '') return;
    
    // 1. 입력창 초기화
    inputField.value = '';
    updateComposerState(); // 높이 및 버튼 상태 업데이트
    
    // 2. AI 응답 스트리밍 시작
    streamAIResponse(message);
}

/**
 * 응답 스트리밍을 강제로 중단합니다.
 */
function stopStreaming() {
    if (isStreaming) {
        isStreaming = false;
        updateComposerState();
        saveAllConversations();
        scrollToBottom(true);
        console.log("응답 스트리밍이 중단되었습니다.");
    }
}

/**
 * Geolocation API를 사용하여 현재 위치를 가져옵니다.
 */
function getLocation() {
    if (locationDisplay && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(4);
                const lon = position.coords.longitude.toFixed(4);
                locationDisplay.textContent = `위도: ${lat}, 경도: ${lon}`;
            },
            (error) => {
                let message;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message = "위치 정보 접근이 거부되었습니다.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = "위치 정보를 사용할 수 없습니다.";
                        break;
                    case error.TIMEOUT:
                        message = "위치 정보를 가져오는 시간이 초과되었습니다.";
                        break;
                    default:
                        message = "알 수 없는 오류가 발생했습니다.";
                        break;
                }
                locationDisplay.textContent = message;
            },
            { timeout: 5000, maximumAge: 0 } // 최대 5초 대기
        );
    } else {
        if (locationDisplay) {
            locationDisplay.textContent = "브라우저에서 위치 정보를 지원하지 않습니다.";
        }
    }
}

/**
 * 스크롤 버튼 표시 여부를 결정합니다.
 */
function handleScrollButtonVisibility() {
    if (contentWrapper) {
        const distanceFromBottom = contentWrapper.scrollHeight - contentWrapper.scrollTop - contentWrapper.clientHeight;
        
        if (distanceFromBottom > 100 && !isStreaming) { 
            scrollDownButton.classList.add('visible'); 
        } else {
            scrollDownButton.classList.remove('visible'); 
        }
    }
}

// ===========================================
// 6. 이벤트 리스너
// ===========================================

// 텍스트 입력 시 전송 버튼 상태 및 텍스트 영역 높이 업데이트
inputField.addEventListener('input', updateComposerState);

// Shift + Enter는 줄바꿈, Enter는 전송
inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});

// 전송 버튼 클릭
sendButton.addEventListener('click', sendMessage);

// 멈춤 버튼 클릭
stopButton.addEventListener('click', stopStreaming);

// 테마 토글
modeToggleCheckbox.addEventListener('change', (e) => {
    setTheme(e.target.checked ? 'light' : 'dark');
});

// 설정 버튼 클릭
settingsButton.addEventListener('click', () => {
    toggleSettingsModal();
});

// 설정 모달 백드롭 클릭
settingsModalBackdrop.addEventListener('click', (e) => {
    if (e.target === settingsModalBackdrop) {
        toggleSettingsModal(false);
    }
});

// 현재 대화 초기화 버튼 클릭
resetChatButton.addEventListener('click', () => {
    toggleSettingsModal(false);
    
    if (currentConversationId) {
        const chatTitle = conversations[currentConversationId].title;
        if (confirm(`현재 대화 ("${chatTitle}")를 초기화하시겠습니까?`)) {
            // 현재 대화 메시지만 초기화
            conversations[currentConversationId].messages = [];
            conversations[currentConversationId].title = '새 대화';
            saveAllConversations();
            renderChatList();
            renderActiveChat();
        }
    }
});

// 정보 버튼 클릭
aboutButton.addEventListener('click', () => {
    toggleAboutModal(true);
});

// 정보 모달 백드롭 클릭
aboutModalBackdrop.addEventListener('click', (e) => {
    if (e.target === aboutModalBackdrop) {
        toggleAboutModal(false);
    }
});

// 플러스 버튼 클릭
plusButton.addEventListener('click', () => {
    togglePlusModal(true);
});

// 플러스 모달 백드롭 클릭
plusModalBackdrop.addEventListener('click', (e) => {
    if (e.target === plusModalBackdrop) {
        togglePlusModal(false);
    }
});

// 이름 입력 모달
nameSubmitBtn.addEventListener('click', () => {
    const inputName = nameInput.value.trim();
    if (inputName) {
        localStorage.setItem('username', inputName);
        username = inputName;
        updateTitle();
        toggleNameInputModal(false);
        inputField.focus();
    } else {
        alert('이름을 입력해주세요.');
        nameInput.focus();
    }
});

nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        nameSubmitBtn.click();
    }
});

// 빠른 액션 버튼 클릭
quickActionButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (!isStreaming) {
            inputField.value = button.dataset.prompt;
            updateComposerState();
            sendMessage();
        }
    });
});

// 전체 대화 초기화 확인 모달
confirmCancelBtn.addEventListener('click', () => {
    toggleResetConfirmModal(false);
});
confirmResetBtn.addEventListener('click', () => {
    localStorage.removeItem('conversations');
    localStorage.removeItem('currentConversationId');
    conversations = {};
    currentConversationId = null;
    toggleResetConfirmModal(false);
    startNewConversation(true);
});

// 🌟 [추가] 메뉴 이벤트 리스너
if(menuToggle) {
    menuToggle.addEventListener('click', () => {
        toggleMenu();
    });
}

if(sideMenuOverlay) {
    sideMenuOverlay.addEventListener('click', () => {
        // 모바일에서 오버레이 클릭 시 닫기
        if (window.innerWidth < 1024) {
            toggleMenu(false);
        }
    });
}

if(newChatMenuBtn) {
    newChatMenuBtn.addEventListener('click', () => {
        startNewConversation();
        if (window.innerWidth < 1024) {
            toggleMenu(false); // 모바일에서 새 대화 시작 후 메뉴 닫기
        }
    });
}

if(resetAllMenuBtn) {
    resetAllMenuBtn.addEventListener('click', () => {
        toggleMenu(false);
        confirmResetAllChats();
    });
}

// 스크롤 이벤트 리스너 (스크롤 다운 버튼 표시/숨김)
if(contentWrapper) {
    contentWrapper.addEventListener('scroll', () => {
        // 1. 현재 맨 아래로부터 떨어진 거리
        const distanceFromBottom = contentWrapper.scrollHeight - contentWrapper.scrollTop - contentWrapper.clientHeight;
        
        // 2. 맨 아래에 도달했을 때 (1px 오차 허용)
        if (distanceFromBottom <= 1) { 
            // 🚨 중요: 맨 아래에 있다면 자동 스크롤 활성화 상태로 간주
            autoScrollEnabled = true; 
            scrollDownButton.classList.remove('visible'); 
        } 
        // 3. 사용자가 위로 스크롤하여 맨 아래에서 100px 이상 떨어졌을 때
        else if (distanceFromBottom > 100) { 
            autoScrollEnabled = false;
            // 🚨 중요: 스트리밍 중이 아닐 때만 버튼을 표시
            if (!isStreaming) { 
                scrollDownButton.classList.add('visible'); 
            }
        }
    });
}

// 스크롤 다운 버튼 클릭 이벤트 리스너
if(scrollDownButton) {
    scrollDownButton.addEventListener('click', () => { 
        scrollToBottom(true); 
        scrollDownButton.classList.remove('visible'); 
        autoScrollEnabled = true; 
    });
}

const toolAttach = document.getElementById('tool-attach');
if(toolAttach) { toolAttach.addEventListener('click', (e) => { e.preventDefault(); togglePlusModal(true); }); }

const toolStudy = document.getElementById('tool-study');
if(toolStudy) { toolStudy.addEventListener('click', () => { toolStudy.classList.toggle('active-blue'); }); }

// 🌟 [추가] PC 환경에서 메뉴 자동 표시/숨김 처리 및 리사이즈 대응
function handleMenuOnLoadAndResize() {
    const isPC = window.innerWidth >= 1024;
    
    // 1. PC 모드 (메뉴 기본 표시)
    if (isPC) {
        // PC에서는 기본적으로 메뉴를 열고, body.menu-open 클래스를 유지하여 컨텐츠를 민다.
        toggleMenu(true);
        sideMenu.classList.add('open'); // PC에서는 transform: translateX(0)이 기본 적용
        sideMenuOverlay.classList.remove('open'); 
        document.body.classList.add('menu-open'); 
        
    } 
    // 2. 모바일 모드 (메뉴 기본 숨김)
    else {
        // 모바일에서는 메뉴를 닫고, body.menu-open 클래스를 제거한다.
        sideMenu.classList.remove('open');
        sideMenuOverlay.classList.remove('open'); 
        document.body.classList.remove('menu-open'); 
    }
}

// ===========================================
// 7. 초기화
// ===========================================

/**
 * 초기화 함수
 */
function initialize() {
  // 1. 테마 로드
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  modeToggleCheckbox.checked = savedTheme === 'dark';
  
  // 2. 사용자 이름 확인 및 UI 설정
  if (!username) {
    toggleNameInputModal(true);
  } else {
    toggleNameInputModal(false); // 이름이 있으면 바로 메인 UI 표시
  }
  updateTitle(); // 이름 기반 제목 업데이트
  
  // 3. 대화 로드
  loadAllConversations();
  
  // 4. 위치 정보 가져오기
  getLocation();
  
  // 5. 메뉴 상태 초기 설정 (PC/Mobile)
  handleMenuOnLoadAndResize();
  
  // 6. 입력창 상태 초기 업데이트
  updateComposerState();
}

// 초기 로드 시 메뉴 상태 설정
document.addEventListener('DOMContentLoaded', handleMenuOnLoadAndResize);

// 윈도우 크기 변경 시 메뉴 상태 업데이트
window.addEventListener('resize', handleMenuOnLoadAndResize);

// DOM 로드 완료 후 초기화 함수 실행
document.addEventListener('DOMContentLoaded', initialize);
