// Toy Control — SillyTavern 第三方扩展
// 监听 AI 回复中的 ‹toy:模式› 标记，转发给本地控制服务器 server.py (GET /set?mode=xxx)

(() => {
    const EXT = 'toy-control';

    // 与 server.py 的模式白名单保持一致，两头改要同步
    const MODES = [
        'wave', 'pulse', 'tease', 'edge', 'deep',
        'devour', 'chaos', 'storm', 'gentle', 'climb',
        'breathe', 'heartbeat', 'gspot', 'alternate', 'denial', 'random',
        'stop',
    ];

    // 兼容 ‹toy:xxx› 和 <toy:xxx> 两种括号
    const MARKER = /[‹<]toy:([a-z]+)[›>]/gi;

    const DEFAULTS = {
        enabled: true,
        hideMarkers: true,
        serverUrl: 'http://localhost:9090',
    };

    const ctx = SillyTavern.getContext();
    if (!ctx.extensionSettings[EXT]) ctx.extensionSettings[EXT] = {};
    const settings = ctx.extensionSettings[EXT];
    for (const key of Object.keys(DEFAULTS)) {
        if (settings[key] === undefined) settings[key] = DEFAULTS[key];
    }

    function extractMode(text) {
        let mode = null;
        for (const m of text.matchAll(MARKER)) {
            const name = m[1].toLowerCase();
            if (MODES.includes(name)) mode = name; // 一条回复多个标记时，最后一个生效
        }
        return mode;
    }

    async function sendMode(mode, isRetry = false) {
        const base = settings.serverUrl.replace(/\/+$/, '');
        const url = `${base}/set?mode=${encodeURIComponent(mode)}`;
        try {
            // no-cors：server.py 不配 CORS 头也能送达指令，只是读不到响应体
            await fetch(url, { mode: 'no-cors', cache: 'no-store' });
            console.log(`[${EXT}] → ${mode}`);
        } catch (err) {
            if (!isRetry) return sendMode(mode, true); // 静默重试一次
            console.warn(`[${EXT}] 发送失败 (${mode})`, err);
        }
    }

    function onMessageReceived(messageId) {
        if (!settings.enabled) return;
        const msg = ctx.chat[messageId];
        if (!msg || msg.is_user || msg.is_system) return;
        const mode = extractMode(msg.mes || '');
        if (mode) sendMode(mode);
    }

    function stripMarkersFrom(el) {
        if (el && /[‹<]toy:/i.test(el.innerHTML)) {
            el.innerHTML = el.innerHTML.replace(MARKER, '');
        }
    }

    function onMessageRendered(messageId) {
        if (!settings.hideMarkers) return;
        stripMarkersFrom(document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`));
    }

    function onChatChanged() {
        if (!settings.hideMarkers) return;
        document.querySelectorAll('#chat .mes .mes_text').forEach(stripMarkersFrom);
    }

    async function testConnection() {
        const base = settings.serverUrl.replace(/\/+$/, '');
        try {
            await fetch(`${base}/state`, { cache: 'no-store' });
            toastr.success('已连接', 'Toy Control');
        } catch {
            try {
                await fetch(`${base}/state`, { mode: 'no-cors', cache: 'no-store' });
                toastr.info('服务器可达（server.py 未配 CORS 头，不影响控制功能）', 'Toy Control');
            } catch {
                toastr.error('连接失败，检查 server.py 是否在跑、地址是否正确', 'Toy Control');
            }
        }
    }

    function addSettingsUI() {
        const html = `
        <div class="toy-control-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>🎮 Toy Control</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <label class="checkbox_label">
                        <input type="checkbox" id="toy_ctrl_enabled"><span>启用</span>
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="toy_ctrl_hide"><span>隐藏消息里的标记</span>
                    </label>
                    <label for="toy_ctrl_server">服务器地址</label>
                    <input type="text" id="toy_ctrl_server" class="text_pole" placeholder="http://localhost:9090">
                    <div class="flex-container">
                        <input type="button" class="menu_button" id="toy_ctrl_test" value="测试连接">
                        <input type="button" class="menu_button" id="toy_ctrl_stop" value="⏹ 立即停止">
                    </div>
                </div>
            </div>
        </div>`;
        $('#extensions_settings2').append(html);

        $('#toy_ctrl_enabled').prop('checked', settings.enabled).on('change', function () {
            settings.enabled = this.checked;
            if (!this.checked) sendMode('stop'); // 关掉开关时顺手停机，保险
            ctx.saveSettingsDebounced();
        });
        $('#toy_ctrl_hide').prop('checked', settings.hideMarkers).on('change', function () {
            settings.hideMarkers = this.checked;
            ctx.saveSettingsDebounced();
        });
        $('#toy_ctrl_server').val(settings.serverUrl).on('input', function () {
            settings.serverUrl = $(this).val().trim();
            ctx.saveSettingsDebounced();
        });
        $('#toy_ctrl_test').on('click', testConnection);
        $('#toy_ctrl_stop').on('click', () => sendMode('stop'));
    }

    jQuery(() => {
        addSettingsUI();
        ctx.eventSource.on(ctx.eventTypes.MESSAGE_RECEIVED, onMessageReceived);
        ctx.eventSource.on(ctx.eventTypes.CHARACTER_MESSAGE_RENDERED, onMessageRendered);
        ctx.eventSource.on(ctx.eventTypes.CHAT_CHANGED, onChatChanged);
        console.log(`[${EXT}] 已加载`);
    });
})();
