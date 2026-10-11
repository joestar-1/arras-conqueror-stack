// ==UserScript==
// @name         test script
// @namespace    http://tampermonkey.net/
// @version      idk-patched-goto-aim
// @description  minitab for pr clan (Lag Fixed) - Go to coords now also aims + fires
// @author       pr clan (modified by sukonoe) "skid"
// @match        *://arras.io/
// @match        *://localhost:42789/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=arras.io
// @run-at       document-start
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/msgpack-lite/0.1.26/msgpack.min.js
// ==/UserScript==

const ENC_OWNER_KEY = "cHItb3duZXIxMjM0";
const ENC_MEMBER_KEY = "cHItbWVtYmVyLTEyMzQ=";

if (window.name === '__pr_is_bot') window.__is_bot = true;

function decodeKey(encoded) {
    try { return atob(encoded); } catch(e) { return null; }
}

const OWNER_KEY = decodeKey(ENC_OWNER_KEY);
const MEMBER_KEY = decodeKey(ENC_MEMBER_KEY);

let authRole = null;

function checkAuth() {
    const stored = localStorage.getItem('arras_auth_role');
    if (stored === 'owner' || stored === 'member') {
        authRole = stored;
        return true;
    }
    return false;
}

function setAuth(role) {
    authRole = role;
    localStorage.setItem('arras_auth_role', role);
}

function clearAuth() {
    authRole = null;
    localStorage.removeItem('arras_auth_role');
}

function showAuthModal() {
    const existing = document.getElementById('authModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'authModal';
    Object.assign(modal.style, {
        position: 'fixed',
        top: '0', left: '0', width: '100vw', height: '100vh',
        background: 'radial-gradient(ellipse at center, rgba(10, 18, 38, 0.88) 0%, rgba(3, 7, 18, 0.96) 100%)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '1000000',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(8, 14, 28, 0.97) 100%)',
        backdropFilter: 'blur(24px)',
        borderRadius: '24px',
        padding: '36px 38px',
        width: '390px',
        maxWidth: '92%',
        textAlign: 'center',
        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(56, 189, 248, 0.2), 0 0 30px rgba(56, 189, 248, 0.1)',
        color: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease'
    });

    card.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);"></div>
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 18px; background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.2)); border: 1px solid rgba(56, 189, 248, 0.35); margin-bottom: 18px; box-shadow: 0 8px 24px rgba(56, 189, 248, 0.2);">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
        </div>
        <h2 style="margin: 0 0 6px 0; font-weight: 700; font-size: 22px; letter-spacing: -0.4px; color: #f8fafc; font-family: 'Inter', sans-serif;">PR Clan Access</h2>
        <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">Enter authorization key to unlock controls</p>
        <div style="position: relative; margin-bottom: 18px;">
            <input type="password" id="authKeyInput" placeholder="••••••••••••" style="
                width: 100%;
                padding: 13px 18px;
                border-radius: 14px;
                border: 1px solid rgba(148, 163, 184, 0.2);
                background: rgba(3, 7, 18, 0.6);
                color: #f1f5f9;
                font-size: 15px;
                text-align: center;
                letter-spacing: 2px;
                outline: none;
                box-sizing: border-box;
                transition: all 0.2s ease;
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
            " autocomplete="off">
        </div>
        <button id="authSubmitBtn" style="
            background: linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #6366f1 100%);
            border: none;
            padding: 13px 22px;
            border-radius: 14px;
            color: white;
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 0.3px;
            cursor: pointer;
            width: 100%;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.35);
        ">Verify Access</button>
        <p id="authError" style="color: #f87171; font-size: 12px; margin-top: 14px; min-height: 20px; font-weight: 600; letter-spacing: 0.2px;"></p>
    `;

    modal.appendChild(card);
    (document.body || document.documentElement).appendChild(modal);

    const input = document.getElementById('authKeyInput');
    const submitBtn = document.getElementById('authSubmitBtn');
    const errorSpan = document.getElementById('authError');

    input.onfocus = () => {
        input.style.borderColor = '#38bdf8';
        input.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.3)';
    };
    input.onblur = () => {
        input.style.borderColor = 'rgba(148, 163, 184, 0.2)';
        input.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3)';
    };

    submitBtn.onmouseover = () => {
        submitBtn.style.transform = 'translateY(-1px)';
        submitBtn.style.boxShadow = '0 10px 25px rgba(14, 165, 233, 0.45)';
    };
    submitBtn.onmouseout = () => {
        submitBtn.style.transform = 'translateY(0)';
        submitBtn.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.35)';
    };

    function verify() {
        const key = input.value.trim();
        if (key === OWNER_KEY) {
            setAuth('owner');
            modal.remove();
            initCheatScript();
        } else if (key === MEMBER_KEY) {
            setAuth('member');
            modal.remove();
            initCheatScript();
        } else {
            errorSpan.innerText = 'Invalid authorization key. Access denied.';
            input.value = '';
            input.focus();
            input.style.borderColor = '#f87171';
            input.style.boxShadow = '0 0 0 3px rgba(248, 113, 113, 0.2)';
            setTimeout(() => {
                input.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                input.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3)';
            }, 1200);
        }
    }

    submitBtn.onclick = verify;
    input.onkeypress = (e) => { if (e.key === 'Enter') verify(); };
    input.focus();
}

function initCheatScript() {
    if (location.hostname == "localhost" && location.port != "42789")
        return;

    let xrayEnabled = false;
    let xrayAlphaVal = 0.5;
    let seeEverythingEnabled = false;
    let bulletHiderEnabled = false;
    let hideAssistMessages = false;
    let hideKillMessages = false;
    let _skipPathOperations = 0;
    let _popupSkipUntil = 0;
    // Bullet hider: max radius (in canvas pixels) treated as a "bullet".
    // Lowered default from 25 -> 14: at 25 it was also catching small
    // tank bodies (drones, small bots, or any tank when zoomed out),
    // since tank radius and bullet radius overlap at that threshold.
    // Now adjustable live via the Visual menu slider instead of fixed.
    let BULLET_RADIUS_THRESHOLD = parseFloat(localStorage.getItem("arras_bullet_radius_threshold")) || 14;

    let killLog = [];
    let lastKillMessage = "";
    const KILL_PREFIX   = "You killed ";
    const ASSIST_PREFIX = "You assisted ";

    const LS_USED_NAMES     = "arras_used_names";
    const LS_AUTO_USERNAME  = "arras_auto_username_enabled";
    let autoUsernameEnabled = false;
    let usernameTheme       = 'legit';
    const usernameThemes = {
        legit: [
            'TestTank2','camrateur','sup4','maybe 1m','raw','fun','4ever#1',
            'Bot all? ','For Thē Worthy','palle','TYPESHIT','DEATHMACHINE','k',
            'Mr pato','49th & Main','For Thē Sigmas','Romania','Friends?Lol','REVENGE',
            'Vanity','v1sion','lyra','Boempatat','Andre','Huge','sunex','IM THE KING',
            'Dattel','he he','Gon','Qwerty','Kato','hide more noob','s1gow','Lipovuy',
            'Synaro','RAMPAGE','Xamo','Arena Closer','w','Daylight','bananona',
            'king bob!!!!!!!','as','Sela','porowolf','FRENCH MONSTER','black swan',
            'eee','WARSHIP','earthworm','wat:)','SmiLE','huuh','balls','me',
            'David Buster','Revenge','Bloaty','GHOST','1m','A Mine','Lucas lol',
            'God of WarΩ','Cathy','Fuzz','JJD','_mxs_','POLICE','nesty','aaaa',
            'Eurofighter','DefeatTheEvil','meme','Muzan','JustBuyAHouse','Logan_Fr_',
            'just a new ','all eyes on me','EMMANUEL','mrk','Tigran','HHEALLER',
            'Behind U ( 0_0)','No Mercy','Drukez','abbas','R3DBULLMAN1AC','^oo^',
            'The Smiths','rick','Ron','dwpe','iRlyH8ThisGame!','Kojot34','milers',
            'HANNABAL','Happy.','södra','slur','supercazzola','VotreMaman','gerard',
            'Morthais','SejeM','Genocider','iAmIsTom','StopFarmingIf45','kurton',
            'ARENA CLOSER 1','Booster','accident','equinox','melisa','hola','caspar',
            'monttu','bigdihrandy','torta pounder','ivoker','savage','Noe','TicTac 42',
            'ModRiax','trucker091','bilmem','KiOKiO','Regy :)'
        ]
    };

    function generateRandomName() {
        const length = Math.floor(Math.random() * 6) + 6;
        let name = '';
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        for (let i = 0; i < length; i++) {
            let char = chars[Math.floor(Math.random() * chars.length)];
            if (Math.random() < 0.1) char = char.toUpperCase();
            name += char;
        }
        return name;
    }

    function getRandomUsername() {
        const tag = '[PR]';
        let name;
        let usedNames = [];
        try {
            const stored = localStorage.getItem(LS_USED_NAMES);
            if (stored) usedNames = JSON.parse(stored);
        } catch (e) {}
        if (usernameTheme === 'random') {
            name = generateRandomName();
        } else {
            const names = usernameThemes[usernameTheme] || usernameThemes.legit;
            const available = names.filter(n => !usedNames.includes(n));
            if (available.length === 0) {
                usedNames = [];
                localStorage.setItem(LS_USED_NAMES, JSON.stringify([]));
                name = names[Math.floor(Math.random() * names.length)];
            } else {
                name = available[Math.floor(Math.random() * available.length)];
            }
            usedNames.push(name);
            localStorage.setItem(LS_USED_NAMES, JSON.stringify(usedNames));
        }
        return `${tag} ${name}`;
    }

    let chatMessage1 = "--[|[PR] ON TOP | BEST MB CLAN |]--";
    let chatMessage2 = "--[| JOIN [PR] NOW! |]--";

    let _fpsLimit = 30;
    let _followerFpsEnabled = false;
    let _originalRAF = null, _originalCAF = null, _limiterActive = false;

    function _enableFpsLimiter(targetFps) {
        if (_limiterActive) _disableFpsLimiter();
        _originalRAF = window.requestAnimationFrame;
        _originalCAF = window.cancelAnimationFrame;
        let lastExec = performance.now();
        const interval = 1000 / targetFps;
        window.requestAnimationFrame = function(cb) {
            return _originalRAF(function rafWrapper(ts) {
                const elapsed = ts - lastExec;
                if (elapsed >= interval) {
                    lastExec = ts - (elapsed % interval);
                    cb(ts);
                } else {
                    _originalRAF(rafWrapper);
                }
            });
        };
        window.cancelAnimationFrame = function(id) { return _originalCAF(id); };
        _limiterActive = true;
    }

    function _disableFpsLimiter() {
        if (!_limiterActive) return;
        window.requestAnimationFrame = _originalRAF;
        window.cancelAnimationFrame = _originalCAF;
        _limiterActive = false;
    }

    const LS_FORMATION_CONFIG  = "arras_formation_config";
    const LS_SWARM_REGISTRY    = "arras_swarm_registry";
    const LS_FORCE_RESPAWN_MB  = "arras_force_respawn_trigger";
    let mySessionId = Math.random().toString(36).substr(2, 9);
    let swarmIndex = 0, swarmSize = 1, lastSwarmUpdate = 0;
    let formationConfig = { enabled: false, type: 'line_front', spacing: 60, text: 'PR' };
    let _extTextPointCache = null;

    // Renders `text` to an offscreen canvas and samples the opaque pixels
    // into a centered point cloud, used by the "text" formation shape.
    function _buildTextPoints(text) {
        const cvs = document.createElement('canvas');
        cvs.width = 600; cvs.height = 200;
        const tctx = cvs.getContext('2d');
        tctx.fillStyle = '#fff';
        tctx.font = 'bold 150px sans-serif';
        tctx.textBaseline = 'middle';
        tctx.textAlign = 'left';
        const tw = tctx.measureText(text).width || 1;
        tctx.fillText(text, (cvs.width - tw) / 2, cvs.height / 2);
        const imgData = tctx.getImageData(0, 0, cvs.width, cvs.height).data;
        const pts = [];
        const step = 5; // sample density, lower = more points
        for (let y = 0; y < cvs.height; y += step) {
            for (let x = 0; x < cvs.width; x += step) {
                if (imgData[(y * cvs.width + x) * 4 + 3] > 128) pts.push({ x, y });
            }
        }
        if (!pts.length) return [{ x: 0, y: 0 }];
        let cx2 = 0, cy2 = 0;
        pts.forEach(p => { cx2 += p.x; cy2 += p.y; });
        cx2 /= pts.length; cy2 /= pts.length;
        return pts.map(p => ({ x: p.x - cx2, y: p.y - cy2 }));
    }
    let _fmCache = null;

    function updateSwarmRegistry() {
        try {
            const now = Date.now();
            let reg = {};
            const raw = localStorage.getItem(LS_SWARM_REGISTRY);
            if (raw) { try { reg = JSON.parse(raw); } catch(e){} }
            for (let id in reg) { if (now - reg[id].ts > 3000) delete reg[id]; }
            reg[mySessionId] = { ts: now, role: 'leader' };
            localStorage.setItem(LS_SWARM_REGISTRY, JSON.stringify(reg));
            const sorted = Object.keys(reg).sort((a,b) => {
                if (reg[a].role === 'leader') return -1;
                if (reg[b].role === 'leader') return 1;
                return a.localeCompare(b);
            });
            swarmSize = sorted.length;
            swarmIndex = sorted.indexOf(mySessionId);
            if (swarmIndex === -1) swarmIndex = 0;
        } catch(e) {}
    }

    function _showNotif(msg, type = 'success') {
        let container = document.getElementById('pr_notif_container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pr_notif_container';
            Object.assign(container.style, {
                position: 'fixed', top: '24px', right: '24px',
                zIndex: '99999999', display: 'flex', flexDirection: 'column',
                gap: '10px', pointerEvents: 'none'
            });
            document.body.appendChild(container);
        }
        const n = document.createElement('div');
        const isSuccess = type === 'success';
        Object.assign(n.style, {
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(8, 14, 28, 0.98))',
            border: isSuccess ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(239, 68, 68, 0.4)',
            borderLeft: `4px solid ${isSuccess ? '#38bdf8' : '#ef4444'}`,
            borderRadius: '12px',
            padding: '10px 18px',
            color: '#f8fafc',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '12.5px',
            fontWeight: '600',
            backdropFilter: 'blur(16px)',
            boxShadow: isSuccess 
                ? '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.2)' 
                : '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(239, 68, 68, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: '0',
            transform: 'translateX(20px)',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        });
        n.innerHTML = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${isSuccess ? '#38bdf8' : '#ef4444'};box-shadow:0 0 8px ${isSuccess ? '#38bdf8' : '#ef4444'};"></span><span>${msg}</span>`;
        container.appendChild(n);
        requestAnimationFrame(() => {
            n.style.opacity = '1';
            n.style.transform = 'translateX(0)';
        });
        setTimeout(() => {
            n.style.opacity = '0';
            n.style.transform = 'translateY(-8px)';
            setTimeout(() => n.remove(), 300);
        }, 2200);
    }

    let _liveStatus = 'Ready';
    let _livePos = '(0, 0)';
    let _liveDist = '---';

    const LS_RESPAWN_BUILD = "arras_respawn_build_pr";
    const LS_HIDE_ASSIST = "arras_hide_assist_pr";
    const LS_HIDE_KILL = "arras_hide_kill_pr";
    let _selectedRespawnBuild = 'none';
    const _respawnBuilds = {
        gale:   { upgrades: ['KeyH','KeyY','KeyK','KeyI'], stats: ['Digit2','Digit2','Digit2','Digit2','Digit3','Digit3','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7'] },
        limpet: { upgrades: ['KeyX','Space'], stats: ['Digit2','Digit2','Digit2','Digit2','Digit3','Digit3','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit4','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit5','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit6','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7','Digit7'] }
    };

    function _executeBuild(buildName) {
        const bd = _respawnBuilds[buildName];
        if (!bd) return;
        const sequence = [...bd.upgrades, ...bd.stats];
        let delay = 300;
        sequence.forEach(key => {
            setTimeout(() => {
                events.press(key);
            }, delay);
            delay += 80;
        });
        _showNotif(`Build: ${buildName}`, 'success');
    }

    // ============================================================
    // MACROS (ported from Follow Bots Ultimate V4)
    // ============================================================
    const MACROS = {
        "Octo": {
            strings: ["hykiec;hykjec;uiuke;khkhe;hyec;hiiy;hykyec;hyhyec"],
            skills: ["[0/0/3/9/9/9/9/3/0/0]"]
        },
        "refuge": {
            strings: ["[ecquuq]"],
            skills: ["[3/3/2/9/7/9/9]"]
        },
        "penta": {
    strings: ["yuye"],
    skills: ["[0/4/2/7/7/9/7/6/0/0]"]
},
        "Healers(seige)": {
            strings: ["phe"],
            skills: ["[3/4/2/7/7/9/9/3/0/0]"]
        },
        "ATMG ahh skid": {
            strings: ["iuue;hyyec;hii"],
            skills: ["[0/4/2/7/7/9/7/6/0/0]"]
        },
        "slammer": {
            strings: ["tky"],
            skills: ["12/12/12/0/6"]
            },
        "One way": {
            strings: ["khkhe;khkye;ihyye;yuyje"],
            skills: ["[0/0/9/9/9/9/9/0/0/0]"]
        },
        "Octo + One way": {
            strings: ["khkhe;khkye;ihyye;yuyje;hykiec;hykjec;uiuke;hykue;hiiy;hykyec;hyhyec"],
            skills: ["[0/0/4/9/9/9/9/2/0/0]"]
        },
        "Boosters": {
            strings: ["huyye;huyue;huyie;huyhe;huyje;huyke;huuye;huuue;huuie;huuhe;huuje;huuke;huiye;huiue;huiie;huihe;huije;huike;huhye;huhue;huhie;huhhe;huhje;huhke;hujye;hujue;hujie;hujhe;hujje;hujke;hukye;hukue;hukie;hukhe;hukje;hukke"],
            skills: ["[9/9/0/0/0/0/0/9/6/9]"]
        },
        "Tri-Angle": {
            strings: ["huye;huhe;huie;huje;huke;huue"],
            skills: ["[0/4/2/7/7/9/7/6/0/0]"]
        },
        "Launcher": {
            strings: ["khkhe;khkye;khue"],
            skills: ["[0/0/9/9/9/9/9/0/0/0]"]
        },
        "Norm anni": {
            strings: ["kye;kyue;kyyve"],
            skills: ["[0/0/9/9/9/9/9/0/0/0]"]
        },
        "Invis ram": {
            strings: ["uyiy;...hy"],
            skills: ["[9/9/0/0/0/0/9/9/0/9]"]
        },
        "Mingler": {
            strings: ["hykjec"],
            skills: ["[2/2/3/9/9/9/8/0/0/0]"]
        },
        "Whirlwind": {
            strings: ["hjihec"],
            skills: ["[3/3/0/9/9/9/9/0/0/0]"]
        },
        "Gale": {
            strings: ["hykiec"],
            skills: ["[0/4/2/9/9/9/9/0/0/0]"]
        },
        "Octo Tank": {
            strings: ["hyyec"],
            skills: ["[3/3/0/9/9/9/9/0/0/0]"]
        },
        "Random": {
            strings: function () {
                const chars = "yuihjk,.-";
                let s = "";
                for (let i = 0; i < 5; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
                return [s];
            },
            skills: function () {
                const vals = [];
                for (let i = 0; i < 10; i++) {
                    if (i === 7) vals.push(12);
                    else vals.push(Math.floor(Math.random() * 10));
                }
                return ["[" + vals.join("/") + "]"];
            }
        }
    };

    let _lastMacroName = localStorage.getItem("pr_lastMacroName") || "One way";

    const _SKILL_SLOT_KEYS = ["1","2","3","4","5","6","7","8","9","0"];

    function _expandSkillSteps(skills) {
        const presses = [];
        for (const step of skills) {
            if (typeof step !== "string") continue;
            const match = step.match(/\[([0-9/]+)\]/);
            if (!match) continue;
            const values = match[1].split("/").map(Number);
            for (let i = 0; i < values.length && i < _SKILL_SLOT_KEYS.length; i++) {
                const val = values[i];
                if (val === 0) continue;
                const key = "Digit" + _SKILL_SLOT_KEYS[i];
                if (val === 9) { presses.push({ mHeld: true, key }); }
                else { for (let j = 0; j < val; j++) presses.push({ mHeld: false, key }); }
            }
        }
        return presses;
    }

    function _charToKeyEventInit(char) {
        const SPECIAL = {
            ',': { code: 'Comma', key: ',' },
            '.': { code: 'Period', key: '.' },
            '-': { code: 'Minus', key: '-' },
            '(': { code: 'Digit9', key: '(', shiftKey: true },
            ')': { code: 'Digit0', key: ')', shiftKey: true },
        };
        if (SPECIAL[char]) return SPECIAL[char];
        if (char >= '0' && char <= '9') return { code: 'Digit' + char, key: char };
        return { code: 'Key' + char.toUpperCase(), key: char.toLowerCase() };
    }

    function _macroKeyEvent(info, press) {
        window.dispatchEvent(new KeyboardEvent(press ? "keydown" : "keyup", {
            code: info.code, key: info.key, shiftKey: !!info.shiftKey, bubbles: true, cancelable: true
        }));
    }

    let _isUpgrading = false;
    let _macroAbortToken = { cancelled: false };
    async function performMacroUpgrade(macroName) {
        // Cancel any running macro and start fresh
        _macroAbortToken.cancelled = true;
        _macroAbortToken = { cancelled: false };
        const myToken = _macroAbortToken;
        _isUpgrading = false;
        _isUpgrading = true;
        const mName = macroName || _lastMacroName || "One way";
        const macroTemplate = MACROS[mName] || MACROS["One way"];
        const macro = {
            strings: (typeof macroTemplate.strings === "function") ? macroTemplate.strings() : macroTemplate.strings,
            skills:  (typeof macroTemplate.skills  === "function") ? macroTemplate.skills()  : macroTemplate.skills
        };
        _showNotif(`Macro: ${mName}`, 'success');
        try {
            for (const entry of macro.strings) {
                if (myToken.cancelled) return;
                const variants = entry.split(";");
                const chosen = variants[Math.floor(Math.random() * variants.length)];
                for (const char of chosen) {
                    if (myToken.cancelled) return;
                    const info = _charToKeyEventInit(char);
                    _macroKeyEvent(info, true);  await sleep(0.015);
                    _macroKeyEvent(info, false); await sleep(0.010 + Math.random() * 0.020);
                }
                await sleep(0.050);
            }
            if (myToken.cancelled) return;
            await sleep(0.200);
            const presses = _expandSkillSteps(macro.skills);
            let i = 0;
            while (i < presses.length) {
                if (myToken.cancelled) return;
                if (presses[i].mHeld) {
                    _macroKeyEvent({ code: "KeyM", key: "m" }, true); await sleep(0.030);
                    while (i < presses.length && presses[i].mHeld) {
                        if (myToken.cancelled) { _macroKeyEvent({ code: "KeyM", key: "m" }, false); return; }
                        _macroKeyEvent({ code: presses[i].key, key: presses[i].key.replace("Digit","") }, true);  await sleep(0.030);
                        _macroKeyEvent({ code: presses[i].key, key: presses[i].key.replace("Digit","") }, false); await sleep(0.050);
                        i++;
                    }
                    _macroKeyEvent({ code: "KeyM", key: "m" }, false); await sleep(0.060);
                } else {
                    _macroKeyEvent({ code: presses[i].key, key: presses[i].key.replace("Digit","") }, true);  await sleep(0.030);
                    _macroKeyEvent({ code: presses[i].key, key: presses[i].key.replace("Digit","") }, false); await sleep(0.060);
                    i++;
                }
            }
        } catch(e) { console.error("Macro error:", e); }
        finally { if (!myToken.cancelled) { _isUpgrading = false; console.log("Macro finished."); } }
    }

    const LS_FOLLOW_DIST_PR = "arras_follow_dist_pr";
    let _followDistance = 0;

    const LS_PRECISE_AIM_PR = "arras_precise_aim_pr";
    let _preciseAim = true;
    try { const s = localStorage.getItem(LS_PRECISE_AIM_PR); if (s !== null) _preciseAim = JSON.parse(s); } catch(e){}

    let _ingame = false;
    const _OrigWS = window.WebSocket;
    class _PRWebSocket extends _OrigWS {
        constructor(...args) {
            super(...args);
            this.addEventListener("message", () => {
                if (_ingame) return;
                const kd = new KeyboardEvent('keydown', { key:'l', code:'KeyL', bubbles:true, cancelable:true });
                const ku = new KeyboardEvent('keyup',   { key:'l', code:'KeyL', bubbles:true, cancelable:true });
                document.dispatchEvent(kd);
                setTimeout(() => document.dispatchEvent(ku), 50);
                _ingame = true;
            }, { once: true });
        }
    }
    if (!window.__is_bot) window.WebSocket = _PRWebSocket;

    try {
        const su = localStorage.getItem(LS_AUTO_USERNAME);
        if (su !== null) autoUsernameEnabled = JSON.parse(su);
        const st = localStorage.getItem('arras_username_theme');
        if (st) usernameTheme = st;
        const sc1 = localStorage.getItem('arras_chat_msg_1');
        if (sc1) chatMessage1 = sc1;
        const sc2 = localStorage.getItem('arras_chat_msg_2');
        if (sc2) chatMessage2 = sc2;
        const sfd = localStorage.getItem(LS_FOLLOW_DIST_PR);
        if (sfd !== null) _followDistance = parseInt(sfd);
        const sfm = localStorage.getItem(LS_FORMATION_CONFIG);
        if (sfm) formationConfig = JSON.parse(sfm);
        const srb = localStorage.getItem(LS_RESPAWN_BUILD);
        if (srb) _selectedRespawnBuild = srb;
        const sha = localStorage.getItem(LS_HIDE_ASSIST);
        if (sha !== null) hideAssistMessages = JSON.parse(sha);
        const shk = localStorage.getItem(LS_HIDE_KILL);
        if (shk !== null) hideKillMessages = JSON.parse(shk);
    } catch(e) {}

    setInterval(() => { updateSwarmRegistry(); }, 1000);

    const _origAEL = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, handler, options) {
        if (['touchstart','touchmove','touchend'].includes(type) && !handler.__prScript) {
            const wrapped = function(e) {
                if (e.__prHandled) return;
                return handler.apply(this, arguments);
            };
            wrapped.__prScript = true;
            return _origAEL.call(this, type, wrapped, options);
        }
        return _origAEL.apply(this, arguments);
    };

    Node.prototype.nappend = Node.prototype.appendChild;
    Node.prototype.appendChild = function (node) {
        if (["pw-spawn-ad", "pw-respawn-ad"].includes(node.id)) return;
        this.nappend(node);
    };

    const utils = {
        getDir(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); },
        getDist(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); },
        randint(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; },
        choice(arr) { return arr[this.randint(0, arr.length - 1)]; },
        removeBrackets(string) {
            if (string.startsWith("[")) string = string.slice(1);
            if (string.endsWith("]")) string = string.slice(0, -1);
            return string;
        }
    };

    const tankFOV = {
        "Base": 1, "Sniper": 1.200606585788562, "Director": 1.1000866551126518,
        "Smasher": 1.050693240901213, "Mega Smasher": 1.1000866551126518,
        "Dual": 1.200606585788562, "Musket": 1.2010398613518198,
        "Nailgun": 1.1009532062391683, "Gunner Trapper": 1.2512998266897748,
        "Overgunner": 1.1009532062391683, "Assassin": 1.3513864818024266,
        "Ranger": 1.501733102253033, "Falcon": 1.2014731369150782,
        "Stalker": 1.3513864818024266, "Auto-Assassin": 1.3513864818024266,
        "Single": 1.0004332755632583, "Deadeye": 1.3513864818024266,
        "Hunter": 1.3006932409012133, "Predator": 1.3006932409012133,
        "X-Hunter": 1.3006932409012133, "Poacher": 1.3006932409012133,
        "Ordnance": 1.3006932409012133, "Nimrod": 1.3513864818024266,
        "Minigun": 1.200606585788562, "Streamliner": 1.3006932409012133,
        "Crop Duster": 1.200606585788562, "Barricade": 1.200606585788562,
        "Vulture": 1.200606585788562, "Rifle": 1.200606585788562,
        "Crossbow": 1.200606585788562, "Armsman": 1.200606585788562,
        "Revolver": 1.200606585788562, "Marksman": 1.200606585788562,
        "Fork": 1.200606585788562, "Bushwhacker": 1.200606585788562,
        "Field Gun": 1.1507798960138649, "Banshee": 1.1000866551126518,
        "Overseer": 1.1000866551126518, "Overlord": 1.1000866551126518,
        "Auto-Overseer": 1.1000866551126518, "Overdrive": 1.1000866551126518,
        "Commander": 1.1507798960138649, "Cruiser": 1.2014731369150782,
        "Carrier": 1.2014731369150782, "Battleship": 1.2512998266897748,
        "Fortress": 1.2014731369150782, "Auto-Cruiser": 1.2014731369150782,
        "Underseer": 1.0710571923743502, "Necromancer": 1.0710571923743502,
        "Maleficitor": 1.0710571923743502, "Infestor": 1.0710571923743502,
        "Spawner": 1.1000866551126518, "Factory": 1.1000866551126518,
        "Auto-Spawner": 1.1000866551126518, "Manager": 1.1000866551126518,
        "Big Cheese": 1.1000866551126518, "Builder": 1.1503466204506068,
        "Constructor": 1.1503466204506068, "Auto-Builder": 1.1503466204506068,
        "Engineer": 1.1503466204506068, "Assembler": 1.1503466204506068,
        "Boomer": 1.1503466204506068, "Architect": 1.1503466204506068,
        "Launcher": 1.1507798960138649, "Skimmer": 1.1507798960138649,
        "Twister": 1.1507798960138649, "Swarmer": 1.1507798960138649,
        "Sidewinder": 1.3006932409012133, "Shotgun": 1.1503466204506068,
        "Railgun": 1.2010398613518198, "Finger": 1.2010398613518198
    };

    const getEl = id => document.getElementById(id);
    let globalGameScale = 1;
    let globalFov = 46;

    //  Bullet Hider: skip arc() calls for small circles (bullets) 
    const _origArc = CanvasRenderingContext2D.prototype.arc;
    CanvasRenderingContext2D.prototype.arc = function(x, y, r, startAngle, endAngle, anticlockwise) {
        if (bulletHiderEnabled && r > 0 && r < BULLET_RADIUS_THRESHOLD / (globalGameScale || 1)) return;
        return _origArc.apply(this, arguments);
    };
    // 

    const _origSetTransform = CanvasRenderingContext2D.prototype.setTransform;
    CanvasRenderingContext2D.prototype.setTransform = function(a,b,c,d,e,f) {
        const absA = Math.abs(a);
        // Old gate was > 1.5 — scale shrinks as tank grows, so fov froze.
        // Now tracks the full valid range so mouse-follow stays accurate at any size.
        if (absA > 0.01 && absA < 50) {
            globalGameScale = absA;
            if (this.canvas) {
                const fov = this.canvas.width / globalGameScale;
                if (fov > 10 && fov < 2000) globalFov = fov;
            }
        }
        return _origSetTransform.apply(this, arguments);
    };

    const keys = {};
    const mouse = { x: 0, y: 0, dir: 0, lock: false, lockX: 0, lockY: 0, down: false, buttons: {} };
    const center = {
        get x() { return innerWidth / 2 },
        get y() { return innerHeight / 2 }
    };
    const events = {
        mouseDown(button, x, y) {},
        mouseUp(button, x, y) {},
        click(but, x, y) { this.mouseDown(but, x, y); this.mouseUp(but, x, y); },
        moveTo(x, y) {},
        moveToDir(dir) {
            this.moveTo(center.x + Math.cos(dir) * 100, center.y + Math.sin(dir) * 100);
        },
        _keyEvent(code, pressed) {
            const eventType = pressed ? 'keydown' : 'keyup';
            const _codeToKey = {
                'Space':       ' ',
                'Enter':       'Enter',
                'Escape':      'Escape',
                'Backspace':   'Backspace',
                'Tab':         'Tab',
                'Backquote':   '`',
                'Minus':       '-',
                'Equal':       '=',
                'BracketLeft': '[',
                'BracketRight':']',
                'Semicolon':   ';',
                'Quote':       "'",
                'Comma':       ',',
                'Period':      '.',
                'Slash':       '/',
                'ArrowUp':     'ArrowUp',
                'ArrowDown':   'ArrowDown',
                'ArrowLeft':   'ArrowLeft',
                'ArrowRight':  'ArrowRight',
            };
            let key;
            if (_codeToKey[code]) {
                key = _codeToKey[code];
            } else if (/^Key([A-Z])$/.test(code)) {
                key = RegExp.$1.toLowerCase();
            } else if (/^Digit(\d)$/.test(code)) {
                key = RegExp.$1;
            } else {
                key = code;
            }
            const event = new KeyboardEvent(eventType, {
                key, code, bubbles: true, cancelable: true, composed: true, itsMe: true
            });
            try { dispatchEvent(event); } catch (e) {}
        },
        keyDown(code) {
            this._keyEvent(code, true);
            if (!window.__is_bot && replicatableKeys.includes(code) && getEl("botsReplKeys")?.checked) {
                currentKeyStates[code] = true;
                localStorage.setItem(LS_KEYS, JSON.stringify({ keyStates: currentKeyStates, t: Date.now() }));
            }
        },
        keyUp(code) {
            this._keyEvent(code, false);
            if (!window.__is_bot && replicatableKeys.includes(code) && getEl("botsReplKeys")?.checked) {
                if (_pulseHolds[code]) return;
                currentKeyStates[code] = false;
                localStorage.setItem(LS_KEYS, JSON.stringify({ keyStates: currentKeyStates, t: Date.now() }));
            }
        },
        press(key, func, ms) {
            this.keyDown(key);
            func && func();
            if (ms) {
                setTimeout(() => this.keyUp(key), ms);
            } else {
                const pulseMs = key === 'KeyE' ? 30 : 80;
                if (!window.__is_bot && replicatableKeys.includes(key) && getEl("botsReplKeys")?.checked) {
                    if (_pulseHolds[key]) clearTimeout(_pulseHolds[key]);
                    _pulseHolds[key] = setTimeout(() => {
                        delete _pulseHolds[key];
                        currentKeyStates[key] = false;
                        localStorage.setItem(LS_KEYS, JSON.stringify({ keyStates: currentKeyStates, t: Date.now() }));
                    }, pulseMs);
                }
                this.keyUp(key);
            }
        }
    };

    const PI2 = Math.PI * 2;
    const player = {};
    player.fov = 1;
    const sinsay = {};
    let chatting;
    let ping = 20;
    const stealedClans = [];
    let isConnecting;
    let bots = [];

    const LS_KEYS      = "pr_key_replication";
    const LS_MOUSE_AIM = "arras_multibox_aim_parent";
    let _lastAimMx = -1, _lastAimMy = -1, _lastAimClick = -1;
    const replicatableKeys = [
        'Backquote',
        'Digit1','Digit2','Digit3','Digit4','Digit5',
        'Digit6','Digit7','Digit8','Digit9','Digit0',
        'Minus','Equal','Backspace',
        'Tab',
        'KeyQ','KeyE','KeyR','KeyT',
        'KeyY','KeyU','KeyI','KeyO','KeyP',
        'BracketLeft','BracketRight',
        'KeyF','KeyG',
        'KeyH','KeyJ','KeyK','KeyL',
        'Semicolon','Quote','Enter',
        'KeyZ','KeyX','KeyC','KeyV','KeyB',
        'KeyN','KeyM','Comma','Period','Slash',
        'Space','Escape',
    ];
    let currentKeyStates = {};
    let lastReceivedKeyStates = {};
    const _pulseHolds = {};
    replicatableKeys.forEach(k => { currentKeyStates[k] = false; lastReceivedKeyStates[k] = false; });

    let botsMsg = () => {};
    let canvas, ctx;
    let stackCycle = false;
    let stackRunning = false;
    let hasAutoUpgraded = false;
    let hasUpgraded = false;
    let spawned = false;
    let firstSpawn = true;
    let nrCycle = 0;
    const nrTanks = { launchers: "yuih", builders: "yihj" };
    let tankSelect, botTankSelect, botMoving, fedingCheckbox, botMouseFollow;
    let currentFedPath = [];

    const nWinListener = window.addEventListener;
    window.addEventListener = function (...args) {
        let eventType = args[0];
        if (eventType === "keydown" || eventType === "keyup") {
            let callback = args[1];
            args[1] = function (...args) {
                let newEvent = args[0].isTrusted ? args[0] : {
                    isTrusted: true,
                    key: args[0].key,
                    code: args[0].code,
                    preventDefault: function () {},
                };
                return callback.apply(this, [newEvent]);
            };
        }
        return nWinListener.apply(this, args);
    };

    function triggerStack(tankValue) {
        const tv = tankValue || tankSelect?.value;
        if (!tv) return;
        const stackin = window.__is_bot ? { checked: window.channel?.stackin } : getEl("stackin");
        if (!stackin || !stackin.checked) return;
        if (stackRunning) return;
        if (tv == "nuke") return;

        stackRunning = true;
        mouse.lockX = mouse.x;
        mouse.lockY = mouse.y;

        (async () => {
            if      (tv == "septaM")    await stacks.septa(0.077);
            else if (tv == "septaMa")   await stacks.septa(0.0485);
            else if (tv == "spread")    { mouse.lock = true; await stacks.rotating(0.105, 0.03, 0.12, 12, true); }
            else if (tv == "penta")     { mouse.lock = true; await stacks.rotating(0.0948, 0.026, 0.12, 6, true); }
            else if (tv == "octo")      await stacks.fullrotating(0.025, 0);
            else if (tv == "orbit")     await stacks.fullrotating(0.064, 0);
            else if (tv == "cyclone")   await stacks.cyclone(0.05);
            else if (tv == "tornado")   await stacks.cyclone(0.068);
            else if (tv == "whirlwind") await stacks.cyclone(0.13);
            else if (tv == "guntrap" || tv == "trapguard") {
                while (true) {
                    mouse.lock = true;
                    events.moveToDir(mouse.dir + Math.PI);
                    events.mouseDown(0, mouse.lockX, mouse.lockY);
                    await sleep(0.12);
                    events.moveToDir(mouse.dir);
                    mouse.lock = false;
                    await sleep(0.38);
                    if (!mouse.down) { mouse.lock = false; events.mouseUp(0, mouse.lockX, mouse.lockY); break; }
                    events.mouseUp(0, mouse.lockX, mouse.lockY);
                    await sleep(0.08);
                }
            } else if (tv == "conq") {
                while (true) {
                    mouse.lockX = mouse.x;
                    mouse.lockY = mouse.y;
                    mouse.lock = true;
                    events.moveToDir(mouse.dir + Math.PI);
                    events.mouseDown(0, mouse.lockX, mouse.lockY);
                    await sleep(0.12);
                    events.moveToDir(mouse.dir);
                    mouse.lock = false;
                    await sleep(0.9);
                    if (!mouse.down && !mouse.buttons[0]) { mouse.lock = false; events.mouseUp(0, mouse.lockX, mouse.lockY); break; }
                    events.mouseUp(0, mouse.lockX, mouse.lockY);
                    await sleep(0.1);
                }
            } else if (tv == "blockade") {
                await stacks.subverter([0.125, 0.1]);
            } else if (tv == "toppler") {
                await stacks.subverter(...(window.o || [[0.381, 0.1]]));
            } else if (tv == "fighter") {
                setTimeout(() => events.mouseDown(0), 0.1);
                while (true) {
                    stackCycle = !stackCycle;
                    mouse.lock = true;
                    let delta = Math.PI / 2;
                    if (stackCycle) delta = -delta;
                    events.moveToDir(mouse.dir + delta);
                    events.mouseDown(0, mouse.lockX, mouse.lockY);
                    await sleep(0.08);
                    events.moveToDir(mouse.dir);
                    mouse.lock = false;
                    await sleep(0.179);
                    if (!mouse.down) { mouse.lock = false; events.mouseUp(0); events.mouseUp(0, mouse.lockX, mouse.lockY); break; }
                    events.mouseUp(0, mouse.lockX, mouse.lockY);
                    await sleep(0.08);
                }
            } else if (tv == "dreadV2") {
                await stacks.flank(window.o || 0.8);
            }
            mouse.lock = false;
            stackRunning = false;
        })();
    }

    HTMLDivElement.prototype.nListener = HTMLDivElement.prototype.addEventListener;
    HTMLDivElement.prototype.addEventListener = function (event, callback, ...opt) {
        if (event == "mousedown") {
            const ncb = callback;
            callback = function (e) {
                if (mouse.lock && !e.itsMe) { e.clientX = mouse.lockX; e.clientY = mouse.lockY; }
                ncb(e);
                if (!e.itsMe && tankSelect?.value == "nuke" && (e.button == 0 || mouse.buttons[0]))
                    events.moveToDir(mouse.dir + Math.PI);
            };

            events.mouseDown = (button, x, y) => {
                if (!x) x = mouse.x;
                if (!y) y = mouse.y;
                if (bots.length) botsMsg({ type: "mousedown", button, x, y });
                callback({ isTrusted: true, clientX: x, clientY: y, button, preventDefault: () => {}, itsMe: true });
            };

            this.nListener("mousedown", function (e) {
                mouse.down = true;
                mouse.buttons[e.button] = true;
                mouse.dir = utils.getDir(center.x, center.y, mouse.x, mouse.y);
                if (e.button == 0) triggerStack();

                if (bots.length) {
                    botsMsg({ type: "mousedown", button: e.button,
                        x: mouse.lock ? mouse.lockX : e.clientX,
                        y: mouse.lock ? mouse.lockY : e.clientY });
                }

                if (getEl("testinn")?.checked && e.button == 0) {
                    const time = Date.now();
                    if (window._t.length) window._t.at(-1)[1] = (time - window._t2) / 1000;
                    window._t2 = time;
                    getEl('debugg').innerHTML = JSON.stringify(window._t);
                }
            });

        } else if (event == "mouseup") {
            const ncb = callback;
            callback = function (e) {
                if (mouse.lock && !e.itsMe) { e.clientX = mouse.lockX; e.clientY = mouse.lockY; }
                ncb(e);
            };

            events.mouseUp = (button, x, y) => {
                if (!x) x = mouse.x;
                if (!y) y = mouse.y;
                if (bots.length) botsMsg({ type: "mouseup", button, x, y });
                callback({ isTrusted: true, clientX: x, clientY: y, button, preventDefault: () => {}, itsMe: true });
            };

            this.nListener("mouseup", function (e) {
                mouse.down = false;
                mouse.buttons[e.button] = false;
                stackRunning = false;
                if (bots.length) {
                    botsMsg({ type: "mouseup", button: e.button,
                        x: mouse.lock ? mouse.lockX : e.clientX,
                        y: mouse.lock ? mouse.lockY : e.clientY });
                }
                if (getEl("testinn")?.checked && e.button == 0) {
                    const time = Date.now();
                    window._t.push([(time - window._t2) / 1000]);
                    window._t2 = time;
                    getEl('debugg').innerHTML = JSON.stringify(window._t);
                }
            });

        } else if (event == "mousemove") {
            const ncb = callback;
            callback = function (e) {
                if (mouse.lock && !e.itsMe) return;
                if (!e.itsMe && tankSelect?.value == "nuke" && mouse.buttons[0])
                    events.moveToDir(mouse.dir + Math.PI);
                else
                    ncb(e);
            };

            events.moveTo = (x, y) => {
                mouse.lockX = x;
                mouse.lockY = y;
                if (bots.length) botsMsg({ type: "mousemove", x, y, innerWidth, innerHeight });
                callback({ isTrusted: true, clientX: x, clientY: y, preventDefault: () => {}, itsMe: true });
            };

            this.nListener("mousemove", function (e) {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
                mouse.dir = utils.getDir(center.x, center.y, mouse.x, mouse.y);
                if (bots.length && !mouse.lock && getEl("cursorMirror")?.checked) {
                    botsMsg({ type: "cursormirror", nx: mouse.x / innerWidth, ny: mouse.y / innerHeight });
                }
            });
        }

        this.nListener(event, callback, ...opt);
    };

    class Stacks {
        static build  = "0/3/0/8/8/8/7/3";
        static build2 = "0/3/0/8/8/9/6/3";
        static build3 = "0/3/2/8/8/9/9/3";

        async rotating(anglePlus, delay, endDelay = 0.1, num = 12, useCycle) {
            while (true) {
                if (useCycle) stackCycle = !stackCycle;
                let angle = 0;
                for (let i = 0; i <= num; i++) {
                    if (!mouse.down) { mouse.lock = false; events.mouseUp(0, mouse.lockX, mouse.lockY); return; }
                    events.moveToDir((PI2 - angle * (useCycle && stackCycle ? 1 : -1)) + mouse.dir);
                    angle += anglePlus;
                    if (i == 0) events.mouseDown(0, mouse.lockX, mouse.lockY);
                    await sleep(delay);
                }
                events.mouseUp(0, mouse.lockX, mouse.lockY);
                await sleep(endDelay);
            }
        }

        async septa(delay, endDelay = 0.04) {
            mouse.lockX = mouse.x;
            mouse.lockY = mouse.y;
            const barrels = 7;
            const baseAngle = PI2 / barrels;
            while (true) {
                mouse.lock = true;
                const lockDir = mouse.dir;
                const lockX = mouse.lockX;
                const lockY = mouse.lockY;
                let angle = 0;
                for (let i = 0; i <= barrels; i++) {
                    if (!mouse.down) { mouse.lock = false; events.mouseUp(0, lockX, lockY); return; }
                    events.moveToDir((PI2 - angle) + lockDir);
                    if (i === 0) events.mouseDown(0, lockX, lockY);
                    angle += baseAngle * 2;
                    await sleep(delay);
                }
                events.mouseUp(0, lockX, lockY);
                mouse.lock = false;
                await sleep(endDelay);
                mouse.lockX = mouse.x;
                mouse.lockY = mouse.y;
            }
        }

        async fullrotating(delay, endDelay = 0.1) { await this.rotating(PI2 / 50, delay, endDelay, 50); }

        async cyclone(delay) {
            while (true) {
                for (let angle of [0, 2, 1, 3]) {
                    angle = (PI2 / 12) * angle;
                    if (!mouse.down) { mouse.lock = false; events.mouseUp(0, mouse.lockX, mouse.lockY); return; }
                    events.moveToDir((PI2 - angle) + mouse.dir);
                    if (angle == 0) events.mouseDown(0, mouse.lockX, mouse.lockY);
                    await sleep(delay);
                }
                events.mouseUp(0, mouse.lockX, mouse.lockY);
                await sleep(0.1);
            }
        }

        async subverter(...timings) {
            mouse.lock = false;
            events.mouseUp(0);
            events.keyDown("Space");
            for (const timing of timings) {
                await sleep(timing[0]);
                events.keyUp("Space");
                await sleep(timing[1]);
                events.keyDown("Space");
            }
            while (mouse.buttons[0]) await sleep(0.04);
            events.keyUp("Space");
        }

        async flank(delay) {
            while (true) {
                mouse.lock = true;
                events.moveToDir(mouse.dir + Math.PI);
                events.mouseDown(0, mouse.lockX, mouse.lockY);
                await sleep(0.12);
                events.moveToDir(mouse.dir);
                mouse.lock = false;
                await sleep(delay);
                if (!mouse.down) { mouse.lock = false; events.mouseUp(0, mouse.lockX, mouse.lockY); return; }
                events.mouseUp(0, mouse.lockX, mouse.lockY);
                await sleep(0.08);
            }
        }
    }

    class Mapping {
        constructor() { this.lastWall = 0; }
        upgradeTank() { command("Digit1"); }
        placeWall(x, y, type) {
            x += center.x; y += center.y;
            events.moveTo(x, y);
            command("KeyX");
            events.press("Backquote", () => {
                events.press("KeyZ", () => {
                    events.moveTo(
                        x + Math.cos((Math.PI / 12) * type) * 20,
                        y + Math.sin((Math.PI / 12) * type) * 20
                    );
                });
            });
        }
    }

    const stacks  = new Stacks();
    const mapping = new Mapping();

    const tanks = {
        cocktail: { name: "autococktail",         path: "ehupk",  build:"0/4/3/8/8/9/7/4" },
        launchers: { name: "Launcher...",         path: "khkhe;khkye;khue",                  build:"0/0/9/9/9/9/9/0/0/0" },
        spread:    { name: "Spreadshot",          path: "yuuk",  desc: "Right click.",                                    build: Stacks.build  },
        penta:     { name: "Penta Shot",           path: "yuyje",   desc: "Right click.",                                    build: Stacks.build  },
        guntrap:   { name: "Gunner Trapper",       path: "hhu",   desc: "Use 9 reload",                                    build: Stacks.build3 },
        trapguard: { name: "Trap Guard",           path: "hh",    desc: "Use 9 reload. Useful for Bomber branch",          build: Stacks.build3 },
        conq:      { name: "Conqueror",            path: "kyy",   desc: "Works on some Arms Race upgrade.",                build: Stacks.build3 },
        octo:      { name: "Octo Tank",            path: "hyy",   desc: "Right click.",                                    build: Stacks.build  },
        orbit:     { name: "Orbital strike",       path: "hyhi",  desc: "Right click. Cringe.",                            build: Stacks.build  },
        cyclone:   { name: "Cyclone",              path: "hyui",                                                           build: Stacks.build  },
        tornado:   { name: "Tornado",              path: "hyuy",  desc: "cyclone but more stable",                         build: Stacks.build  },
        whirlwind: { name: "Whirlwind",            path: "hyuk",  desc: "Perfect (because slow)",                          build: Stacks.build  },
        septaM:    { name: "Septa-Mech",           path: "hjkh",  desc: "good",                                            build: Stacks.build  },
        septaMa:   { name: "Septa-Machine",        path: "hjiu",  desc: "bad",                                             build: Stacks.build  },
        blockade:  {                               path: "uiji",  desc: "Hold right click. VERY useful in soccer.<br/>Default build is max bullet speed<br/> and 1 bullet health, to knockback ball.", build: "0/9/9/1/0/0/6/9/8" },
        toppler:   { name: "Toppler",              path: "uijh",  desc: "Hold right click.<br/>Right now not works sry",   build: Stacks.build2 },
        anni:      { name: "Annihilator",          path: "ekyue", desc: "Press G to upgrade and shoot<br/>instantly and instantly upgrade to<br/>level 45.", firingWhenUpgrade: true, slowUpgrading: true, build: "0/6/9/9/9/9" },
        fastram:   {                                              desc: "Press G for fast level 45<br/>and fast stats for ramming.<br/>",                     firingWhenUpgrade: true,                  build: "9/9/0/0/0/0/0/9/6/9" },
        finger:    { name: "Finger",               path: "uky",   desc: "Press G to upgrade to finger and shoot.<br/>For nuking in clan wars.", firingWhenUpgrade: true, build: "0/0/9/9/9/9/6" },
        fighter:   { name: "Fighter",              path: "huye",   desc: "Stack for almost any Figher tank branch<br/>in arms race. Right click.<br/>Time killer is cringe.", build: "0/5/0/7/7/9/7/7" },
        nuke:      { name: "Nuker",                path: "huh",   desc: "Right click to reverse.<br/>Not only for nuker.", build: "0/5/0/7/7/9/7/7" },
        auto4:     { name: "Auto-4/6",             path: "hiiy",  desc: "(not stack)",                                     build: Stacks.build  },
        auto4feed: { name: "Auto-4 (feed build)",  path: "hii",                                                            build: "0/0/0/0/0/0/0/9" },
        ultraspawn:{ name: "Ultra Spawner",        path: "jhiy",                                                           build: "0/3/6/8/8/9/5/3" },
        brig:      { name: "Brig",                 path: "yjjj",                                                           build: "0/3/3/9/9/9/9"   },
        overczar:  { name: "Overczar",             path: "jyyy",                                                           build: "0/3/7/8/8/9/4/3" },
        pursuer:   { name: "Pursuer (feed build)", path: "uyiy",                                                           build: "0/0/0/0/0/0/0/9" },
        phys:      { name: "Physician (N+M)",      path: "nm",                                                             build: "9/9/0/0/0/0/6/12/0/9" },
        dreadV2:   { desc: "Stack for destroyer (peacekeeper) dreadnought with 7 reload.", path: "", build: "" },
        fireworks: { name: "Fireworks", path: "khky", build: "0/3/4/8/8/9/9/3" }
    };
    for (const tank in tanks) {
        if (Object.hasOwn(tanks, tank)) tanks[tank].id = tank;
    }

    // Build Editor: snapshot originals (for Reset), then apply saved overrides
    const _defaultBuilds = {};
    for (const key in tanks) { _defaultBuilds[key] = tanks[key].build; }
    try {
        const _buildOverrides = JSON.parse(localStorage.getItem('pr_build_overrides') || '{}');
        for (const key in _buildOverrides) {
            if (tanks[key]) tanks[key].build = _buildOverrides[key];
        }
    } catch (e) { /* ignore malformed override data */ }

    async function sleep(time) {
        if (!time) return;
        await new Promise(r => setTimeout(r, time * 1000));
    }

    async function upgradeTank(path, slow) {
        if (!path) return;
        for (const key of path.toUpperCase()) {
            events.press("Key" + key);
            await sleep(slow ? 0.09 : 0.05);
        }
    }

    function upgradeStats(tank) {
        let build = tank.build;
        if (typeof tank == "string") build = tank;
        else if (!tank.build) return;
        let i = 0;
        for (const stat of build.split("/")) {
            i++;
            if (i == 10) i = 0;
            if (stat == "0") continue;
            for (let i2 = 0; i2 < Number(stat); i2++) events.press("Digit" + i);
        }
    }

    async function command(...ks) {
        events.keyDown("Backquote");
        for (const k of ks) {
            events.press(k);
            await sleep(0.02);
        }
        events.keyUp("Backquote");
    }

    function chat(msg) {
        events.press("Enter");
        const interval = setInterval(() => {
            const input = document.querySelector("body > input[type=text]");
            if (!input) return;
            clearInterval(interval);
            input.value = msg;
            events.press("Enter");
        }, 40);
    }

    function stopMoving() {
        for (const key of "WASD") events.keyUp("Key" + key);
    }

    function dirPathfind(angle) {
        if      (angle >= -Math.PI/8  && angle < Math.PI/8)    events.keyDown("KeyD");
        else if (angle >= Math.PI/8   && angle < 3*Math.PI/8)  { events.keyDown("KeyS"); events.keyDown("KeyD"); }
        else if (angle >= 3*Math.PI/8 && angle < 5*Math.PI/8)  events.keyDown("KeyS");
        else if (angle >= 5*Math.PI/8 && angle < 7*Math.PI/8)  { events.keyDown("KeyS"); events.keyDown("KeyA"); }
        else if (angle >= 7*Math.PI/8 || angle < -7*Math.PI/8) events.keyDown("KeyA");
        else if (angle >= -7*Math.PI/8 && angle < -5*Math.PI/8){ events.keyDown("KeyW"); events.keyDown("KeyA"); }
        else if (angle >= -5*Math.PI/8 && angle < -3*Math.PI/8) events.keyDown("KeyW");
        else { events.keyDown("KeyW"); events.keyDown("KeyD"); }
    }

    let _lastPathAngle = null;
    function pathfind(x, y, minDist = 1) {
        if (!spawned || (window.__is_bot && (!hasUpgraded || !channel.moving))) return;
        const angle = utils.getDir(player.x, player.y, x, y);
        const dist  = utils.getDist(player.x, player.y, x, y);
        if (dist <= minDist) { stopMoving(); _lastPathAngle = null; return; }
        if (_lastPathAngle === null || Math.abs(angle - _lastPathAngle) > 0.15) {
            stopMoving();
            dirPathfind(angle);
            _lastPathAngle = angle;
        }
    }

    let _onSpawnFired = false;
    function onSpawn() {
        if (_onSpawnFired) return;
        _onSpawnFired = true;
        if (window.__is_bot) {
            stopMoving();
            spawned = true;
            hasUpgraded = false;
            const upgradeDelay = 1200 + Math.random() * 600;
            const upgradeFailsafe = setTimeout(() => { hasUpgraded = true; }, 3500);
            setTimeout(() => {
                let t = window.channel.tank;
                const eDelay = 800 + (window.__bot_idx || 0) * 400;
                const pressE = () => {
                    if (!window.channel?.autofireE) return;
                    events._keyEvent('KeyE', true);
                    setTimeout(() => events._keyEvent('KeyE', false), 30);
                };
                if (t == "none") {
                    hasUpgraded = true;
                    clearTimeout(upgradeFailsafe);
                    setTimeout(pressE, eDelay);
                    const pendingMacro = window.channel?.pendingMacro || localStorage.getItem("pr_lastMacroName");
                    if (pendingMacro && MACROS[pendingMacro]) {
                        setTimeout(() => performMacroUpgrade(pendingMacro), 500);
                    }
                } else {
                    if (t == "wiping")       t = { path: "hu" + utils.choice("yhjk"), build: "0/4/2/7/7/9/7/6" };
                    else if (t == "wipingAR")  t = { path: utils.choice(["huyj","hukk","hukh","huju","hujy","huhy","uikj","uikk","kkh","kkk"]), build: "0/4/2/7/7/9/7/6" };
                    else if (t == "necro")     t = { path: "ji" + utils.choice(["yy","yk","yi","ki","hy","hj","hi","iy","iu"]), build: "0/5/3/7/7/9/7/4" };
                    else if (t == "crash")     t = { path: "ce" + utils.choice(["hyuk","yjyk","hjiu","hyuh"]), build: "0/0/0/9/9/9/9/6" };
                    else if (t == "feding")    t = { path: "hu" + utils.choice("yuik"), build: "0/0/0/0/0/0/9/9" };
                    else if (t == "fedingAR")  t = { path: "huu" + utils.choice("yuik"), build: "0/0/0/0/0/0/9/9" };
                    upgradeTank(t.path).then(() => upgradeStats(t)).then(() => {
                        hasUpgraded = true;
                        clearTimeout(upgradeFailsafe);
                        setTimeout(pressE, eDelay);
                    });
                }
            }, upgradeDelay);
        } else {
            console.log(firstSpawn ? "Spawned" : "Respawned");
            const autoStats = getEl("autoStats");
            const tank = tanks[tankSelect?.value];
            if (tank && autoStats?.checked && !hasAutoUpgraded) {
                hasAutoUpgraded = true;
                setTimeout(() => {
                    if (tank.firingWhenUpgrade) {
                        for (let i = 0; i <= 45; i++) events.keyDown("KeyN");
                        events.keyUp("KeyN");
                        upgradeStats(tank);
                        upgradeTank(tank.path, tank.slowUpgrading);
                        events.press("Space", null, 400);
                    } else {
                        upgradeStats(tank);
                        upgradeTank(tank.path);
                    }
                }, 500);
            }
        }

        if (fedingCheckbox?.checked) {
            currentFedPath = [...window.fedPath];
            for (let i = 0; i < 4; i++) events.press("Key" + utils.choice("YUIHJK"));
            events.press("KeyM", () => events.press("Digit8"));
            for (let i = 0; i < 35; i++) events.press("Digit" + utils.randint(3, 7));
            events.press("KeyR");
            spawned = true;
        } else {
            spawned = true;
        }

        firstSpawn = false;
    }

    CanvasRenderingContext2D.prototype.nFT = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y) {
        if (text == null) return this.nFT(text, x, y);
        text = String(text);
        if (text.includes("Coordinates: (")) {
            const match = text.match(/Coordinates: \(([^)]+)\)/);
            if(match) {
                const parts = match[1].split(", ");
                if (!spawned) onSpawn();
                player.oldX = player.x;
                player.oldY = player.y;
                player.x  = parseFloat(parts[0]);
                player.y  = parseFloat(parts[1]);
                player.xv = player.x - player.oldX;
                player.yv = player.y - player.oldY;
            }

        } else if (text.startsWith("Level ")) {
            const parts = text.split(" ");
            if (parts.length >= 3) {
                const tankName = parts.slice(2).join(" ");
                player.class = tankName;
                player.fov   = tankFOV[tankName] || tankFOV["Base"];
            }

        } else if (text.includes("You have spawned! Welcome to the game.")) {
            onSpawn();

        } else if (text.includes("Survived for ")) {
            if (!window.__is_bot) console.log("Died");
            spawned = false;
            firstSpawn = false;
            hasAutoUpgraded = false;
            hasUpgraded = false;
            _onSpawnFired = false;
            if (window.__is_bot || getEl("autoRespawn")?.checked || fedingCheckbox?.checked) {
                const interval = setInterval(() => {
                    if (spawned) { clearInterval(interval); return; }
                    events.press("Enter");
                    events.press("Escape");
                    stopMoving();
                    events.mouseUp(0);
                }, 300);
            }

        } else if (text.startsWith(KILL_PREFIX)) {
            const killMsg = text.trim();
            if (killMsg !== lastKillMessage) {
                lastKillMessage = killMsg;
                const username = killMsg.replace(KILL_PREFIX, '');
                killLog.push({ username, time: new Date().toLocaleTimeString(), timestamp: Date.now(), type: 'kill' });
                _updateKillLog();
            }
            if (hideKillMessages) {
                _popupSkipUntil = performance.now() + 120;
                return;
            }
        } else if (text.startsWith(ASSIST_PREFIX) || text.startsWith("You assissted ")) {
            const aMsg = text.trim();
            if (aMsg !== lastKillMessage) {
                lastKillMessage = aMsg;
                const username = aMsg.replace(/^You assis?sted /, '');
                killLog.push({ username, time: new Date().toLocaleTimeString(), timestamp: Date.now(), type: 'assist' });
                _updateKillLog();
            }
            if (hideAssistMessages) {
                _popupSkipUntil = performance.now() + 120;
                return;
            }
        } else if (text.includes(" ms  ")) {
            const match = text.match(/([0-9]+)\.[0-9]+ ms/);
            if (match) ping = Number(match[1]);

        } else if (text == "Connecting...") {
            isConnecting = true;
        }

        if (!window.__is_bot) {
            const match = text.match(/(\[[^\[\]]+\])/g);
            if (match) {
                let stolen;
                for (const tag of match) {
                    if (!stealedClans.includes(tag) && !/\[\w\]/.test(tag)) {
                        stealedClans.push(tag);
                        stolen = true;
                    }
                }
                if (stolen) { const el = getEl("stealedClans"); if (el) el.innerText = stealedClans.join(" "); }
            }
        }
        this.nFT(text, x, y);
    };

    const nFill = CanvasRenderingContext2D.prototype.fill;
    CanvasRenderingContext2D.prototype.fill = function () {
        if (_skipPathOperations > 0) {
            _skipPathOperations--;
            return;
        }
        if (xrayEnabled) this.globalAlpha = xrayAlphaVal;
        nFill.call(this);
    };

    const nGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
        const context = nGetContext.apply(this, args);
        if (!canvas && context && typeof context.arc === 'function') {
            canvas = this;
            ctx = context;
            const nArc = ctx.arc.bind(ctx);
            ctx.arc = function (x, y, radius, startAngle, endAngle, counterclockwise) {
                return nArc(x, y, radius, startAngle, endAngle, counterclockwise);
            };
        }
        return context;
    };

    const WASM_iS = WebAssembly.instantiateStreaming;
    WebAssembly.instantiateStreaming = async function (wasm, imports) {
        for (let i = 0; i < imports[0].length; i++) {
            if (imports[0][i].toString() === "()=>crypto.getRandomValues(new Uint32Array(1))[0]") {
                imports[0][i] = () => [0];
            } else if (imports[0][i].toString().includes("].globalAlpha=") && !window.__is_bot) {
                imports[0][i] = (idx, val) => {
                    ctx.globalAlpha = seeEverythingEnabled ? 1 : val;
                };
            }
        }
        const instance = await WASM_iS.call(this, wasm, imports);
        let memory_export;
        for (let i in instance.instance.exports) {
            if (instance.instance.exports[i] instanceof WebAssembly.Memory) { memory_export = i; break; }
        }
        Object.defineProperty(window, "HEAPU32", {
            get() { return new Uint32Array(instance.instance.exports[memory_export].buffer); }
        });
        window.xd = () => mem;
        return instance;
    };

    addEventListener("keydown", function (e) {
        if (!(e instanceof KeyboardEvent) && !e.itsMe) return;

        if (!window.__is_bot) {
            if (e.key == "Tab") {
                const m = getEl("scriptMenu");
                if (m) m.style.display = m.style.display == "flex" ? "none" : "flex";
            } else if (e.key == "Enter") {
                const interval = setInterval(() => {
                    const input = document.querySelector("body > input[type=text]");
                    if (!input) return;
                    clearInterval(interval);
                    input.addEventListener("keydown", () => {
                        if (input.value.toLowerCase().includes("ez") && getEl("allowEZ")?.checked)
                            input.value = input.value
                                .replace("ez","еz").replace("Ez","Еz")
                                .replace("eZ","еZ").replace("EZ","ЕZ");
                    });
                }, 40);
            }

            const tank = tanks[tankSelect?.value];
            if (tank && !chatting && !keys["`"]) {
                if (e.key == "x") {
                    const el = getEl("stackin");
                    if (el) el.checked = !el.checked;
                } else if (e.key == "z") {
                    mouse.lock = !mouse.lock;
                } else if (e.key == (tank.firingWhenUpgrade ? "g" : ",")) {
                    if (tank.firingWhenUpgrade) {
                        for (let i = 0; i <= 45; i++) events.keyDown("KeyN");
                        events.keyUp("KeyN");
                        upgradeStats(tank);
                        upgradeTank(tank.path, tank.slowUpgrading);
                        events.press("Space", null, 400);
                    } else {
                        if (getEl("autoStats")?.checked) upgradeStats(tank);
                        upgradeTank(tank.path);
                    }
                }

                if (getEl("sandboxTools")?.checked) {
                    if (e.key == "1") command("KeyC", "KeyH");
                    else if (e.key == "5" && keys[4] && window._ea_army)
                        for (let i = 0; i < 50; i++) command("KeyC", "KeyH");
                    else if (e.key == "8" && keys[6]) command("KeyW", "KeyK");
                }
            }

            if (getEl("botsReplKeys")?.checked && !chatting && (e.isTrusted || e.itsMe)) {
                if (replicatableKeys.includes(e.code)) {
                    currentKeyStates[e.code] = true;
                    localStorage.setItem(LS_KEYS, JSON.stringify({ keyStates: currentKeyStates, t: Date.now() }));
                }
                botsMsg({ type: "keydown", code: e.code });
            }
        }

        keys[e.key] = true;
    });

    addEventListener("keyup", function (e) {
        if (getEl("botsReplKeys")?.checked && !chatting && (e.isTrusted || e.itsMe)) {
            botsMsg({ type: "keyup", code: e.code });
            if (replicatableKeys.includes(e.code)) {
                currentKeyStates[e.code] = false;
                localStorage.setItem(LS_KEYS, JSON.stringify({ keyStates: currentKeyStates, t: Date.now() }));
            }
        }
        keys[e.key] = false;
    });

    function _updateKillLog() {
        const container = document.getElementById('pr_kill_log');
        const countEl   = document.getElementById('pr_kill_count');
        if (!container) return;
        if (killLog.length === 0) {
            container.innerHTML = '<div style="color:rgba(255,255,255,0.4);text-align:center;padding:12px">No kills recorded yet</div>';
            if (countEl) countEl.textContent = '0';
        } else {
            container.innerHTML = killLog.slice().reverse().map(e =>
                `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-family:monospace;font-size:12px;display:flex;justify-content:space-between">
                    <span style="color:${e.type==='assist'?'#ff9500':'#60a5fa'}">${e.type==='assist'?'':''} ${e.username}</span>
                    <span style="opacity:0.5">${e.time}</span>
                </div>`
            ).join('');
            if (countEl) countEl.textContent = killLog.length.toString();
        }
    }

    function _updateStatusPanel() {
        const roleEl  = document.getElementById('pr_stat_role');
        const posEl   = document.getElementById('pr_stat_pos');
        const fovEl2  = document.getElementById('pr_stat_fov');
        const swarmEl = document.getElementById('pr_stat_swarm');
        const statusEl = document.getElementById('pr_stat_status');
        if (roleEl)   roleEl.textContent  = bots.length ? `Leader (${bots.length} bots)` : 'Solo';
        if (posEl && player.x)  posEl.textContent = `(${player.x.toFixed(0)}, ${player.y.toFixed(0)})`;
        if (fovEl2)   fovEl2.textContent  = globalFov ? globalFov.toFixed(1) : '--';
        if (swarmEl)  swarmEl.textContent = `${swarmSize} tabs`;
        if (statusEl) statusEl.textContent = spawned ? 'Alive' : 'Dead/Lobby';
    }

    setInterval(_updateStatusPanel, 1000);

    (function sbxThings() {
        chatting = Boolean(document.querySelector("body > input[type=text]"));

        if (getEl("sbxHeal")?.checked && mouse.down) {
            command("KeyH");
        } else if (!chatting && !keys["`"] && getEl("sandboxTools")?.checked) {
            if (keys["2"]) command("KeyX");
        }

        const nrTank = getEl("noReloadSelect")?.value;
        if (mouse.down && nrTank && nrTank != "disabled") {
            switch (nrTank) {
                case "engineer":  command("KeyQ"); upgradeTank("kui"); break;
                case "surgeon":   command("KeyQ", "Digit2"); events.press("KeyI"); break;
                case "launchers":
                    command("KeyQ");
                    upgradeTank("kh" + nrTanks.launchers[nrCycle]);
                    if (++nrCycle >= nrTanks.launchers.length) nrCycle = 0;
                    break;
                case "builders":
                    command("KeyQ");
                    upgradeTank("ku" + nrTanks.builders[nrCycle]);
                    if (++nrCycle >= nrTanks.builders.length) nrCycle = 0;
                    break;
            }
        }
        setTimeout(sbxThings, 40);
    })();

    setInterval(() => {
        const fovEl = getEl("fovDisplay");
        if (fovEl) fovEl.textContent = globalFov ? globalFov.toFixed(1) : "--";
    }, 500);

    setInterval(() => {
        if (window.__is_bot && player.x) {
            if (sinsay._gotoTarget) {
                const t = sinsay._gotoTarget;
                const dist = utils.getDist(player.x, player.y, t.x, t.y);
                if (dist < 2) { stopMoving(); }
                else pathfind(t.x, t.y, 2);
            } else if (window.channel && window.channel.followMe && sinsay.x !== undefined) {
                pathfind(sinsay.x, sinsay.y, sinsay.minDist !== undefined ? sinsay.minDist : 0.3);
            } else if (window.channel && window.channel.mouseFollow && sinsay.worldX !== undefined) {
                pathfind(sinsay.worldX, sinsay.worldY);
            } else if (sinsay.x) {
                pathfind(sinsay.x, sinsay.y, sinsay.minDist !== undefined ? sinsay.minDist : 3);
            }
        } else if (bots.length) {
            let targetX = player.x + (player.xv || 0) * 20;
            let targetY = player.y + (player.yv || 0) * 20;

            if (botMouseFollow && botMouseFollow.checked && !mouse.lock) {
                targetX = (mouse.x - center.x) / center.x * globalFov + (player.x || 0);
                targetY = (mouse.y - center.y) / center.y * globalFov * (innerHeight / innerWidth) + (player.y || 0);
            }

            if (formationConfig.enabled && bots.length) {
    const n   = bots.length;
    const sp  = formationConfig.spacing || 60;
    const typ = formationConfig.type;
    const dir = Math.atan2(player.yv || 0, player.xv || 0);

    // Invalidate cache more aggressively for dynamic formations
    const dirChanged = Math.abs(dir - (_fmCache?.dir || 0)) > 0.12;
    if (!_fmCache || _fmCache.n !== n || _fmCache.sp !== sp || _fmCache.typ !== typ || dirChanged) {
        const perp = dir + Math.PI / 2;
        const mid  = (n - 1) / 2;

        _fmCache = {
            n, sp, typ, dir,
            offsets: Array.from({ length: n }, (_, i) => {
                const slot = i - mid;

                switch (typ) {
                    // V-shape behind player (default "behind")
                    case 'behind': {
                        const depth = Math.abs(slot) * sp * 0.5 + sp;
                        return {
                            dx: -Math.cos(dir) * depth + Math.cos(perp) * slot * (sp * 0.7),
                            dy: -Math.sin(dir) * depth + Math.sin(perp) * slot * (sp * 0.7),
                            minD: 2
                        };
                    }
                    // V-shape in front of player
                    case 'front': {
                        const depth = Math.abs(slot) * sp * 0.5 + sp;
                        return {
                            dx: Math.cos(dir) * depth + Math.cos(perp) * slot * (sp * 0.7),
                            dy: Math.sin(dir) * depth + Math.sin(perp) * slot * (sp * 0.7),
                            minD: 2
                        };
                    }
                    case 'line':
                        return {
                            dx: Math.cos(perp) * slot * sp,
                            dy: Math.sin(perp) * slot * sp,
                            minD: 2
                        };
                    case 'line_front':
                        return {
                            dx: Math.cos(dir) * sp + Math.cos(perp) * slot * sp,
                            dy: Math.sin(dir) * sp + Math.sin(perp) * slot * sp,
                            minD: 2
                        };
                    case 'line_behind':
                        return {
                            dx: -Math.cos(dir) * sp + Math.cos(perp) * slot * sp,
                            dy: -Math.sin(dir) * sp + Math.sin(perp) * slot * sp,
                            minD: 2
                        };
                    case 'tight':
                        return { dx: 0, dy: 0, minD: 0 };
                    case 'circle': {
                        const a = (Math.PI * 2 / n) * i;
                        return { dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, minD: 2 };
                    }
                    case 'arc_front': {
                        const spread = Math.PI * 0.66; // 120° arc
                        const a = dir + (n === 1 ? 0 : -spread/2 + spread * (i / (n - 1)));
                        return { dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, minD: 2 };
                    }
                    case 'arc_behind': {
                        const spread = Math.PI * 0.66;
                        const a = dir + Math.PI + (n === 1 ? 0 : -spread/2 + spread * (i / (n - 1)));
                        return { dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, minD: 2 };
                    }
                    case 'diamond': {
                        // Diamond around player (front/back/left/right + extras spiral out)
                        const a = (Math.PI / 2) * i + dir;
                        const ring = Math.floor(i / 4) + 1;
                        return {
                            dx: Math.cos(a) * sp * ring,
                            dy: Math.sin(a) * sp * ring,
                            minD: 2
                        };
                    }
                    case 'wedge': {
                        // Arrow pointing forward
                        const row = i;
                        const rowOffset = row % 2 === 0 ? row / 2 : -(row + 1) / 2;
                        return {
                            dx: Math.cos(dir) * sp * (row + 1) + Math.cos(perp) * rowOffset * sp * 0.5,
                            dy: Math.sin(dir) * sp * (row + 1) + Math.sin(perp) * rowOffset * sp * 0.5,
                            minD: 2
                        };
                    }
                    case 'double_line': {
                        // Two parallel lines behind, alternating sides
                        const half = Math.floor(n / 2);
                        const isFront = i < half;
                        const lineSlot = isFront ? i - (half - 1) / 2 : (i - half) - (n - half - 1) / 2;
                        const lineDepth = isFront ? sp * 0.5 : -sp * 0.5;
                        return {
                            dx: Math.cos(dir) * lineDepth + Math.cos(perp) * lineSlot * sp,
                            dy: Math.sin(dir) * lineDepth + Math.sin(perp) * lineSlot * sp,
                            minD: 2
                        };
                    }
                    case 'grid': {
                        // Square grid behind player
                        const cols = Math.ceil(Math.sqrt(n));
                        const row = Math.floor(i / cols);
                        const col = i % cols;
                        const colOffset = col - (cols - 1) / 2;
                        return {
                            dx: -Math.cos(dir) * (row + 1) * sp + Math.cos(perp) * colOffset * sp,
                            dy: -Math.sin(dir) * (row + 1) * sp + Math.sin(perp) * colOffset * sp,
                            minD: 2
                        };
                    }
                    case 'spiral': {
                        const a = i * 0.7 + dir;
                        const r = sp * (1 + i * 0.3);
                        return { dx: Math.cos(a) * r, dy: Math.sin(a) * r, minD: 2 };
                    }
                    case 'random_scatter': {
                        // Deterministic pseudo-random based on index
                        const seed1 = Math.sin(i * 12.9898) * 43758.5453;
                        const seed2 = Math.sin(i * 78.233) * 43758.5453;
                        const rx = (seed1 - Math.floor(seed1)) * 2 - 1;
                        const ry = (seed2 - Math.floor(seed2)) * 2 - 1;
                        return { dx: rx * sp * 2, dy: ry * sp * 2, minD: 2 };
                    }
                    default:
                        return null;
                }
            })
        };
    }

    bots.forEach((bot, i) => {
        const o = _fmCache.offsets[i];
        const fx = o ? player.x + o.dx : targetX;
        const fy = o ? player.y + o.dy : targetY;
        const minD = o ? o.minD : (_followDistance > 0 ? _followDistance : undefined);
        try { bot.contentWindow.channel.message({ type: "position", x: fx, y: fy, minDist: minD }); } catch(e) {}
    });
} else {
    botsMsg({ type: "position", x: targetX, y: targetY, minDist: _followDistance > 0 ? _followDistance : undefined });
}

            if (!window.__is_bot && player.x && getEl("mouseAimMode")?.checked) {
                const ax = player.x + (mouse.x - center.x) / center.x * globalFov;
                const ay = player.y + (mouse.y - center.y) / center.y * (globalFov * (innerHeight / innerWidth));
                botsMsg({ type: 'aimUpdate', aimX: ax, aimY: ay });
            }
        }

        if (fedingCheckbox?.checked && currentFedPath.length) {
            let loc = currentFedPath[0];
            if (utils.getDist(player.x, player.y, loc.x, loc.y) < 2.5) {
                currentFedPath.shift();
                loc = currentFedPath[0];
            }
            if (loc) pathfind(loc.x, loc.y);
        }
    }, 150);


    function relayJoystickToBots(angle, active) {
        if (bots.length) botsMsg({ type: 'joystick', angle, active });
    }

    function initUI() {
        tankSelect     = getEl("tankSelect");
        botTankSelect  = getEl("botTankSelect");
        botMoving      = getEl("botsMoving");
        fedingCheckbox = getEl("doFed");

        if (!window.__is_bot) {
            const menu = document.createElement("div");
            menu.id = "scriptMenu";

            const _isMobileUI = window.innerWidth <= 768;
            Object.assign(menu.style, {
                position: "fixed",
                top: _isMobileUI ? "8px" : "20px",
                left: _isMobileUI ? "8px" : "20px",
                width: "min(92vw, 900px)",
                maxWidth: "calc(100vw - 16px)",
                maxHeight: _isMobileUI ? "calc(100% - 16px)" : "calc(100% - 40px)",
                background: "rgba(8, 14, 28, 0.85)",
                backdropFilter: "blur(16px)",
                color: "#f0f0f0",
                fontFamily: "'Inter', 'Segoe UI', Ubuntu, system-ui",
                fontSize: "13px",
                borderRadius: "20px",
                padding: "16px",
                display: "none",
                gap: "12px",
                flexDirection: "row",
                userSelect: "none",
                boxShadow: "0 25px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                transition: "all 0.2s ease",
                zIndex: "999999"
            });

            const menuNames = ["main","bots","sbx","fed","visual","macros","other","status","killlog","username","chatmsg","perf","test","tutor","keys","extbots"];
            let kbOverlay = null;
            let cursor = null;

            window.changeMenu = function (name) {
                menuNames.forEach(n => {
                    const el = document.getElementById("menu-" + n);
                    if (el) el.style.display = (el.id === "menu-" + name) ? "" : "none";
                });
                if (kbOverlay) kbOverlay.style.display = (name === "keys") ? "flex" : "none";
                document.querySelectorAll("#tabButtons .tabButton").forEach(btn => {
                    const on = (btn.getAttribute("onclick") || "").includes("'" + name + "'")
                        || (btn.getAttribute("onclick") || "").includes('"' + name + '"');
                    btn.classList.toggle("active-tab", on);
                });
                if (typeof stored === "object" && stored) {
                    stored.tab = name;
                    if (typeof saveJSON === "function") saveJSON();
                }
            };

            menu.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

                #scriptMenu * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                #scriptMenu {
                    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
                    background:
                        radial-gradient(900px 500px at 0% 0%, rgba(56, 189, 248, 0.12), transparent 60%),
                        radial-gradient(800px 450px at 100% 100%, rgba(129, 140, 248, 0.1), transparent 55%),
                        linear-gradient(155deg, #090e1a 0%, #050811 50%, #0a1120 100%) !important;
                    border: 1px solid rgba(56, 189, 248, 0.22) !important;
                    border-radius: 20px !important;
                    box-shadow:
                        0 0 0 1px rgba(0, 0, 0, 0.8),
                        0 30px 70px -10px rgba(0, 0, 0, 0.75),
                        0 0 40px rgba(56, 189, 248, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
                    backdrop-filter: blur(24px) saturate(1.3) !important;
                    -webkit-backdrop-filter: blur(24px) saturate(1.3) !important;
                    overflow: hidden !important;
                    animation: prMenuFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }

                @keyframes prMenuFadeIn {
                    from { opacity: 0; transform: scale(0.97) translateY(8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                #scriptMenu::before, #scriptMenu::after { content: none !important; }

                /* Modern Drag Handle Header */
                #dragHandle {
                    position: absolute !important;
                    top: 0 !important; left: 0 !important; right: 0 !important;
                    height: 18px !important;
                    cursor: grab !important;
                    background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.18), transparent) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
                    z-index: 10 !important;
                }
                #dragHandle:active { cursor: grabbing !important; }
                #dragHandle::after {
                    content: '' !important;
                    width: 48px !important;
                    height: 4px !important;
                    border-radius: 99px !important;
                    background: rgba(148, 163, 184, 0.35) !important;
                    box-shadow: 0 0 6px rgba(56, 189, 248, 0.3) !important;
                }

                /* Tab Navigation Sidebar */
                #tabButtons {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 3px !important;
                    flex-shrink: 0 !important;
                    width: 142px !important;
                    overflow-y: auto !important;
                    max-height: calc(100% - 20px) !important;
                    scrollbar-width: none !important;
                    padding: 8px 6px !important;
                    background: rgba(8, 13, 25, 0.7) !important;
                    border-radius: 14px !important;
                    border: 1px solid rgba(148, 163, 184, 0.08) !important;
                    margin-top: 10px !important;
                }
                #tabButtons::-webkit-scrollbar { display: none !important; }

                .tabButton {
                    cursor: pointer !important;
                    background: transparent !important;
                    font-size: 12px !important;
                    width: 100% !important;
                    height: 35px !important;
                    border-radius: 9px !important;
                    color: #94a3b8 !important;
                    border: 1px solid transparent !important;
                    border-left: 3px solid transparent !important;
                    transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    font-weight: 600 !important;
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                    letter-spacing: 0.25px !important;
                    text-align: left !important;
                    padding: 0 10px 0 12px !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                }
                .tabButton:hover {
                    background: rgba(56, 189, 248, 0.08) !important;
                    color: #f1f5f9 !important;
                    transform: translateX(2px) !important;
                }
                .tabButton.active-tab {
                    background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.08)) !important;
                    border-left: 3px solid #38bdf8 !important;
                    border-color: rgba(56, 189, 248, 0.25) !important;
                    color: #38bdf8 !important;
                    font-weight: 700 !important;
                    box-shadow: 0 2px 12px rgba(56, 189, 248, 0.15) !important;
                }

                /* Separators */
                .v-separator {
                    width: 1px !important;
                    background: linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.25) 30%, rgba(99, 102, 241, 0.25) 70%, transparent) !important;
                    flex-shrink: 0 !important;
                    margin: 10px 2px !important;
                }
                .h-separator {
                    height: 1px !important;
                    background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.3), transparent) !important;
                    margin: 12px 0 !important;
                }

                /* Content Panels */
                #menus {
                    flex: 1 !important;
                    overflow-y: auto !important;
                    padding: 16px 18px !important;
                    font-size: 13px !important;
                    max-height: 64vh !important;
                    scrollbar-width: thin !important;
                    scrollbar-color: rgba(56, 189, 248, 0.3) transparent !important;
                    color: #cbd5e1 !important;
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                    font-weight: 500 !important;
                    background: rgba(6, 11, 22, 0.65) !important;
                    border-radius: 14px !important;
                    border: 1px solid rgba(148, 163, 184, 0.08) !important;
                    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.3) !important;
                    margin-top: 10px !important;
                }
                #menus::-webkit-scrollbar { width: 5px !important; }
                #menus::-webkit-scrollbar-thumb {
                    background: rgba(56, 189, 248, 0.3) !important;
                    border-radius: 99px !important;
                }
                #menus::-webkit-scrollbar-thumb:hover {
                    background: rgba(56, 189, 248, 0.5) !important;
                }

                #menus p {
                    margin: 7px 0 !important;
                    line-height: 1.6 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    flex-wrap: wrap !important;
                    gap: 6px !important;
                }

                #menus label {
                    color: #94a3b8 !important;
                    font-size: 12px !important;
                    font-weight: 500 !important;
                    letter-spacing: 0.2px !important;
                }

                /* Section Headings */
                #menus b, #menus h4 {
                    color: #38bdf8 !important;
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                    font-weight: 700 !important;
                    letter-spacing: 0.8px !important;
                    text-transform: uppercase !important;
                    font-size: 11px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 7px !important;
                    margin: 8px 0 6px !important;
                }
                #menus b::before, #menus h4::before {
                    content: '' !important;
                    width: 7px !important;
                    height: 7px !important;
                    border-radius: 50% !important;
                    background: #38bdf8 !important;
                    box-shadow: 0 0 10px #38bdf8 !important;
                }

                /* Inputs & Selects */
                #menus select,
                #menus input[type="text"],
                #menus input[type="password"],
                #menus input[type="number"],
                #menus textarea {
                    background: rgba(4, 8, 18, 0.85) !important;
                    border: 1px solid rgba(148, 163, 184, 0.18) !important;
                    border-radius: 10px !important;
                    padding: 8px 12px !important;
                    color: #f1f5f9 !important;
                    font-size: 12.5px !important;
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                    font-weight: 500 !important;
                    outline: none !important;
                    transition: all 0.2s ease !important;
                    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                }
                #menus select:hover,
                #menus input:hover,
                #menus textarea:hover {
                    border-color: rgba(56, 189, 248, 0.35) !important;
                }
                #menus select:focus,
                #menus input:focus,
                #menus textarea:focus {
                    border-color: #38bdf8 !important;
                    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15), inset 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                }

                /* Toggle Switches */
                #menus input[type="checkbox"] {
                    appearance: none !important;
                    -webkit-appearance: none !important;
                    width: 38px !important;
                    height: 20px !important;
                    border-radius: 99px !important;
                    background: rgba(148, 163, 184, 0.2) !important;
                    border: 1px solid rgba(148, 163, 184, 0.18) !important;
                    cursor: pointer !important;
                    vertical-align: middle !important;
                    position: relative !important;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    flex-shrink: 0 !important;
                }
                #menus input[type="checkbox"]::before {
                    content: '' !important;
                    position: absolute !important;
                    top: 2px !important;
                    left: 2px !important;
                    width: 14px !important;
                    height: 14px !important;
                    border-radius: 50% !important;
                    background: #94a3b8 !important;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
                }
                #menus input[type="checkbox"]:checked {
                    background: linear-gradient(90deg, #0284c7, #38bdf8) !important;
                    border-color: #38bdf8 !important;
                    box-shadow: 0 0 12px rgba(56, 189, 248, 0.4) !important;
                }
                #menus input[type="checkbox"]:checked::before {
                    transform: translateX(18px) !important;
                    background: #ffffff !important;
                    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8) !important;
                }

                /* Range Sliders */
                #menus input[type="range"] {
                    accent-color: #38bdf8 !important;
                    height: 5px !important;
                    border-radius: 99px !important;
                    background: rgba(148, 163, 184, 0.2) !important;
                    outline: none !important;
                }

                /* Buttons */
                #menus button {
                    cursor: pointer !important;
                    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(99, 102, 241, 0.05)) !important;
                    border: 1px solid rgba(56, 189, 248, 0.28) !important;
                    border-radius: 9px !important;
                    padding: 7px 13px !important;
                    color: #e0f2fe !important;
                    font-size: 11.5px !important;
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                    font-weight: 650 !important;
                    letter-spacing: 0.3px !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
                }
                #menus button:hover {
                    background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.12)) !important;
                    border-color: #38bdf8 !important;
                    color: #ffffff !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 5px 15px rgba(56, 189, 248, 0.2) !important;
                }
                #menus button:active {
                    transform: translateY(0) scale(0.97) !important;
                }

                /* Danger / Kill Buttons */
                #extKill1, #extKill2, #extKill3, #extKill4, #extKillAll, #dcBots, #resetAuthBtn {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.08)) !important;
                    border: 1px solid rgba(239, 68, 68, 0.38) !important;
                    color: #fca5a5 !important;
                }
                #extKill1:hover, #extKill2:hover, #extKill3:hover, #extKill4:hover, #extKillAll:hover, #dcBots:hover, #resetAuthBtn:hover {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.28), rgba(185, 28, 28, 0.18)) !important;
                    border-color: #ef4444 !important;
                    color: #ffffff !important;
                    box-shadow: 0 5px 15px rgba(239, 68, 68, 0.25) !important;
                }

                /* Primary Action / Spawn Buttons */
                #botFireToggle, #createBot, #spawnMultiple, #extReconnectAll, #reconnectBots,
                #extSpawnAll1, #extSpawnAll5, #extSpawnAll10, #extForceRespawn, #extConnectAllTop {
                    background: linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(99, 102, 241, 0.15)) !important;
                    border: 1px solid rgba(56, 189, 248, 0.45) !important;
                    color: #7dd3fc !important;
                }
                #botFireToggle:hover, #createBot:hover, #spawnMultiple:hover, #extReconnectAll:hover, #reconnectBots:hover,
                #extSpawnAll1:hover, #extSpawnAll5:hover, #extSpawnAll10:hover, #extForceRespawn:hover, #extConnectAllTop:hover {
                    background: linear-gradient(135deg, rgba(14, 165, 233, 0.35), rgba(99, 102, 241, 0.25)) !important;
                    border-color: #38bdf8 !important;
                    color: #ffffff !important;
                    box-shadow: 0 5px 18px rgba(14, 165, 233, 0.3) !important;
                }

                /* Slider Buttons (+ / -) */
                .slider-btn {
                    width: 24px !important;
                    height: 24px !important;
                    border-radius: 7px !important;
                    background: rgba(56, 189, 248, 0.12) !important;
                    border: 1px solid rgba(56, 189, 248, 0.3) !important;
                    color: #38bdf8 !important;
                    font-size: 13px !important;
                    font-weight: 700 !important;
                    cursor: pointer !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.15s ease !important;
                    margin: 0 4px !important;
                }
                .slider-btn:hover {
                    background: rgba(56, 189, 248, 0.25) !important;
                    color: #ffffff !important;
                    transform: scale(1.05) !important;
                }

                /* Auth Badge */
                #authBadge {
                    position: absolute !important;
                    bottom: 8px !important;
                    right: 12px !important;
                    font-size: 9.5px !important;
                    color: #34d399 !important;
                    background: rgba(16, 185, 129, 0.12) !important;
                    padding: 3px 10px !important;
                    border-radius: 999px !important;
                    border: 1px solid rgba(16, 185, 129, 0.35) !important;
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                    font-weight: 700 !important;
                    letter-spacing: 0.6px !important;
                    text-transform: uppercase !important;
                    box-shadow: 0 0 12px rgba(16, 185, 129, 0.15) !important;
                }

                /* Monospace Data Displays */
                #fovDisplay, #pr_stat_role, #pr_stat_pos, #pr_stat_fov, #pr_stat_swarm, #pr_stat_status, #extBotCount, #pr_formation_spacing_val, #pr_follow_dist_val, #bulletHiderThreshVal {
                    color: #38bdf8 !important;
                    font-family: 'JetBrains Mono', 'Share Tech Mono', monospace !important;
                    font-weight: 600 !important;
                }

                /* Toggle Card Style (.ext-tog) */
                .ext-tog {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    gap: 8px !important;
                    background: rgba(10, 16, 32, 0.75) !important;
                    border: 1px solid rgba(148, 163, 184, 0.12) !important;
                    border-radius: 11px !important;
                    padding: 8px 11px !important;
                    cursor: pointer !important;
                    color: #cbd5e1 !important;
                    font-weight: 500 !important;
                    font-size: 11.5px !important;
                    transition: all 0.18s ease !important;
                    user-select: none !important;
                }
                .ext-tog:hover {
                    border-color: rgba(56, 189, 248, 0.35) !important;
                    background: rgba(56, 189, 248, 0.08) !important;
                    color: #ffffff !important;
                }

                /* Panels (.ext-panel) */
                .ext-panel {
                    background: linear-gradient(145deg, rgba(12, 19, 36, 0.85), rgba(6, 10, 22, 0.95)) !important;
                    border: 1px solid rgba(56, 189, 248, 0.16) !important;
                    border-radius: 14px !important;
                    padding: 13px 15px !important;
                    margin-bottom: 12px !important;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
                }
                .ext-panel-title {
                    font-size: 11px !important;
                    font-weight: 750 !important;
                    letter-spacing: 1px !important;
                    text-transform: uppercase !important;
                    color: #38bdf8 !important;
                    margin-bottom: 10px !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                }
                .ext-panel-title::before {
                    content: '' !important;
                    width: 6px !important;
                    height: 6px !important;
                    border-radius: 50% !important;
                    background: #38bdf8 !important;
                    box-shadow: 0 0 10px #38bdf8 !important;
                }

                /* Terminal */
                #extTerminal {
                    font-family: 'JetBrains Mono', 'Share Tech Mono', monospace !important;
                    font-size: 11px !important;
                    line-height: 1.5 !important;
                    color: #38bdf8 !important;
                    background: #030712 !important;
                    border: 1px solid rgba(56, 189, 248, 0.22) !important;
                    border-radius: 12px !important;
                    padding: 10px 12px !important;
                    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5) !important;
                }

                /* Mobile Optimization */
                @media (max-width: 768px) {
                    #scriptMenu {
                        font-size: 14px !important;
                        flex-direction: column !important;
                        width: 95vw !important;
                        max-height: 85vh !important;
                    }
                    #tabButtons {
                        flex-direction: row !important;
                        flex-wrap: wrap !important;
                        width: 100% !important;
                        max-height: 110px !important;
                    }
                    .tabButton {
                        width: calc(33.3% - 4px) !important;
                        height: 34px !important;
                        font-size: 11px !important;
                        justify-content: center !important;
                        padding: 0 !important;
                        border-left: none !important;
                    }
                    .tabButton.active-tab {
                        border: 1px solid #38bdf8 !important;
                    }
                    #menus { max-height: 52vh !important; }
                }
            </style>
            <style>
                #joystick, .joystick, #apm-joystick, .apm-joystick,
                [id*="joystick"], [class*="joystick"],
                [id*="Joystick"], [class*="Joystick"],
                canvas ~ div[style*="border-radius: 50%"],
                canvas ~ div[style*="border-radius:50%"] {
                    display: none !important;
                }
            </style>
            <div id="dragHandle"></div>
            <div id="tabButtons">
                <button onclick="changeMenu('main')"   class="tabButton">Main</button>
                <button onclick="changeMenu('bots')"   class="tabButton">Botting</button>
                <button onclick="changeMenu('sbx')"    class="tabButton">Sandbox</button>
                <button onclick="changeMenu('fed')"    class="tabButton">Feeding</button>
                <button onclick="changeMenu('visual')" class="tabButton">Visuals</button>
                <button onclick="changeMenu('macros')" class="tabButton">Macros</button>
                <button onclick="changeMenu('other')"  class="tabButton">Other</button>
                <button onclick="changeMenu('status')" class="tabButton">Status</button>
                <button onclick="changeMenu('killlog')" class="tabButton">Kill Log</button>
                <button onclick="changeMenu('username')" class="tabButton">Username</button>
                <button onclick="changeMenu('chatmsg')" class="tabButton">Chat</button>
                <button onclick="changeMenu('perf')"   class="tabButton">Perf</button>
                <div class="h-separator"></div>
                <button onclick="changeMenu('tutor')"  class="tabButton">Help</button>
                <button onclick="changeMenu('keys')"   class="tabButton">Keys</button>
                <button onclick="changeMenu('extbots')" class="tabButton">Ext Bots</button>
            </div>
            <div class="v-separator"></div>
            <div id="menus">
                <div id="menu-main" style="display:none">
                    Tank:
                        <select id="tankSelect">
                            <option value="spread">Spreadshot</option>
                            <option value="penta">Penta Shot</option>
                            <option value="guntrap">Gunner Trapper</option>
                            <option value="trapguard">Trap Guard</option>
                            <option value="conq">Conqueror</option>
                            <option value="octo">Octo Tank</option>
                            <option value="orbit">Orbital strike</option>
                            <option value="cyclone">Cyclone *</option>
                            <option value="tornado">Tornado</option>
                            <option value="whirlwind">Whirlwind *</option>
                            <option value="septaM">Septa-Mech *</option>
                            <option value="septaMa">Septa-Machine *</option>
                            <option value="blockade">Blockade</option>
                            <option value="anni">Annihilator</option>
                            <option value="fastram">Fast ramming</option>
                            <option value="finger">Finger</option>
                            <option value="fighter">Any Fighter</option>
                            <option value="nuke">Nuker</option>
                            <option value="auto4">Auto-4/6</option>
                            <option value="dreadV2">Peacekeeper</option>
                        </select>
                    </p>
                    <b id="tankDesc"></b>
                    Stacking <input id="stackin" type=checkbox></p>
                    Aimlock (P) <input id="aimlockToggle" type=checkbox></p>
                    Auto respawn <input id="autoRespawn" type=checkbox></p>
                    Auto stats (, key) <input id="autoStats" type=checkbox></p>
                    Allow type "ez" <input id="allowEZ" type=checkbox></p>
                    <div class="h-separator"></div>
                    <p id="soccerbotWrapper" hidden>Soccer bot <input id="soccerbot" type=checkbox></p>
                    <p id="timekillerWrapper" hidden>Time killer <input id="timekiller" type=checkbox></p>
                </div>
                <div id="menu-bots" style="display:none">
                    Copy keys <input id="botsReplKeys" type=checkbox></p>
                    Bot autofire (E) <input id="botAutofireE" type=checkbox></p>
                    Moving <input id="botsMoving" type=checkbox checked></p>
                    Disable render <input id="disRender" type=checkbox></p>
                    Mirror cursor <input id="cursorMirror" type=checkbox></p>
                    Mouse aim mode <input id="mouseAimMode" type=checkbox></p>
                    Mouse follow mode <input id="mouseFollowMode" type=checkbox></p>
                    Server link:<br>
                        <input id="botServerLink" placeholder="paste arras.io link here" style="width:100%;margin-top:4px;">
                        <span id="botServerLinkStatus" style="font-size:11px;opacity:0.6;"></span>
                    </p>
                    <button id="createBot">Create bot</button></p>

                        Number: <input type="number" id="spawnCount" value="10" min="1" max="50" style="width:60px;">
                        <button id="spawnMultiple">Spawn Multiple</button>
                    </p>
                    <button id="reconnectBots">Reconnect bots</button></p>
                    <button id="forceJoinBots">Force Join (Enter)</button></p>
                    <button id="reloadBots">Reload bots</button></p>
                    <button id="dcBots">Disconnect bots</button></p>
                    <button id="botFireToggle" style="background:rgba(59,130,246,0.7)">Bot fire: ON</button></p>
                    <select id="botTankSelect"></select>
                    Clan tag <input id="botClan" style="width:100px;">
                        <select id="botClanPreset" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:4px 6px;color:white;font-size:11px;margin-top:4px;">
                            <option value="">— Presets —</option>
                            <option value="℘ׁ">~AS Long: ℘ׁ</option>
                            <option value="">~AS Short: </option>
                            <option value="[℘ׁ]">~AS CW: [℘ׁ]</option>
                            <option value="[ᵀᵀ]">~AS Tag: [ᵀᵀ]</option>
                            <option value="PR">PR</option>
                            <option value="ηยʅl̷">NL Long: ηยʅl̷</option>
                            <option value="ℒ">NL Short: ℒ</option>
                            <option value="[ηuʅl̷]">NL CW: [ηuʅl̷]</option>
                        </select>
                    </p>
                    Unnamed bots <input id="botUnnamed" type=checkbox></p>
                    Go to coords:<br>
                        <span style="font-size:11px;">X: <input id="botGotoX" type="number" value="0" style="width:70px;"> Y: <input id="botGotoY" type="number" value="0" style="width:70px;"></span><br>
                        <label style="font-size:11px;"><input id="botGotoFire" type="checkbox" checked> Fire while aiming at target</label><br>
                        <button id="botGotoBtn" style="margin-top:4px;">Send bots</button>
                        <button id="botGotoStop" style="margin-top:4px;">Stop</button>
                    </p>
                    Auto RMB (bots) <input id="autoRMB" type=checkbox></p>
                    Chat spam <input id="botChatSpam" type=checkbox>
                    <input id="botChatMsg" placeholder="message..." style="width:100%;margin-top:4px;">
                    </p>
                </div>
                <div id="menu-extbots" style="display:none">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
                        <span style="font-weight:800;font-size:13px;color:#38bdf8;letter-spacing:0.3px;">External Bot Servers</span>
                        <button type="button" id="extConnectAllTop" title="Connect / reconnect every server" style="padding:7px 14px;font-size:12px;font-weight:800;background:linear-gradient(90deg,rgba(34,197,94,0.2),rgba(56,189,248,0.15));border:1px solid rgba(74,222,128,0.5);color:#86efac;border-radius:10px;cursor:pointer;box-shadow:0 4px 14px rgba(34,197,94,0.15);">Connect All Servers</button>
                    </div>
                    <div id="extLiveBar" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;padding:10px 12px;border-radius:12px;background:linear-gradient(90deg,rgba(34,197,94,0.1),rgba(56,189,248,0.08));border:1px solid rgba(74,222,128,0.25);">
                        <div>
                            <div style="font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#86efac;">Live bots (all workflows)</div>
                            <div style="font-size:22px;font-weight:800;color:#4ade80;font-family:'Share Tech Mono',monospace;line-height:1.2;"><span id="extBotCount">0</span></div>
                        </div>
                        <div style="text-align:right;font-size:11px;color:#94a3b8;line-height:1.45;">
                            <div><span id="extLiveServers">0</span> servers reporting</div>
                            <div style="opacity:0.85;">sum of real spawned — not requested</div>
                        </div>
                    </div>
<!-- Top Controls Row -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                        <div>
                            <label style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Server Hash</label>
                            <input id="extServerHash" placeholder="e.g. ca3008" style="width:100%;margin-top:3px;padding:5px 8px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:12px;box-sizing:border-box;">
                            <div style="font-size:10px;margin-top:2px;"> <a id="extServerLink" href="#" target="_blank" style="color:#60a5fa;text-decoration:underline;word-break:break-all;">-</a></div>
                        </div>
                        <div>
                            <label style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Bot Name</label>
                            <input id="extBotName" placeholder="leave empty = unnamed" value="" style="width:100%;margin-top:3px;padding:5px 8px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:12px;box-sizing:border-box;">
                            <label class="ext-tog" style="margin-top:6px;" title="Force empty name (ignores text field)"><input id="extUnnamed" type="checkbox"> Unnamed bots</label>
                        </div>
                        <div>
                            <label style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Clan Tags (rotates)</label>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:3px;">
                                <input id="extClanTag1" placeholder="Tag 1" style="padding:4px 6px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;box-sizing:border-box;">
                                <input id="extClanTag2" placeholder="Tag 2" style="padding:4px 6px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;box-sizing:border-box;">
                                <input id="extClanTag3" placeholder="Tag 3" style="padding:4px 6px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;box-sizing:border-box;">
                                <input id="extClanTag4" placeholder="Tag 4" style="padding:4px 6px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;box-sizing:border-box;">
                            </div>
                        </div>
                    </div>

                    <!-- Tank Selector -->
                    <div style="margin-bottom:10px;">
                        <label style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Tank</label>
                        <div id="extTankContainer" style="position:relative;margin-top:3px;">
                            <div id="extTankTrigger" style="width:100%;box-sizing:border-box;background:rgba(2,6,14,0.8);border:1px solid rgba(59,130,246,0.18);border-radius:3px;padding:6px 10px;color:#e2e8f0;font-size:12px;font-family:'Rajdhani',sans-serif;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:border-color 0.2s;">
                                <span id="extSelectedTankDisplay">Select Tank Class</span>
                                <input type="text" id="extTankSearchInput" placeholder="Search tanks…" style="display:none;background:transparent;border:none;color:#e2e8f0;font-size:12px;flex:1;outline:none;font-family:'Rajdhani',sans-serif;">
                                <span id="extTankArrow" style="opacity:0.5;font-size:10px;"></span>
                            </div>
                            <div id="extTankOptionsList" style="display:none;position:fixed;background:#0e0e1a;border:1px solid rgba(59,130,246,0.3);border-radius:6px;max-height:260px;overflow-y:auto;z-index:99999999;box-shadow:0 24px 60px rgba(0,0,0,0.8);font-family:'Rajdhani',sans-serif;font-size:13px;color:#cbd5e1;scrollbar-width:thin;scrollbar-color:rgba(59,130,246,0.3) transparent;"></div>
                        </div>
                        <div id="extQuickTanks" style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;">
                            <button type="button" class="ext-quick-tank" data-tank="crash" style="padding:5px 10px;font-size:11px;font-weight:700;border-radius:8px;cursor:pointer;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.45);color:#f87171;">Crash</button>
                            <button type="button" class="ext-quick-tank" data-tank="spike" style="padding:5px 10px;font-size:11px;font-weight:600;border-radius:8px;cursor:pointer;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);color:#7dd3fc;">Spike</button>
                            <button type="button" class="ext-quick-tank" data-tank="booster" style="padding:5px 10px;font-size:11px;font-weight:600;border-radius:8px;cursor:pointer;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);color:#7dd3fc;">Booster</button>
                            <button type="button" class="ext-quick-tank" data-tank="anni" style="padding:5px 10px;font-size:11px;font-weight:600;border-radius:8px;cursor:pointer;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);color:#7dd3fc;">Anni</button>
                            <button type="button" class="ext-quick-tank" data-tank="factory" style="padding:5px 10px;font-size:11px;font-weight:600;border-radius:8px;cursor:pointer;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);color:#7dd3fc;">Factory</button>
                            <button type="button" class="ext-quick-tank" data-tank="fighter" style="padding:5px 10px;font-size:11px;font-weight:600;border-radius:8px;cursor:pointer;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);color:#7dd3fc;">Fighter</button>
                        </div>
                        <div class="ext-panel" style="margin-top:10px;">
                            <div class="ext-panel-title">Bot build (stats)</div>
                            <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">Sent with each <b>F</b> spawn packet (and saved for next spawns). Example: <code style="color:#7dd3fc;">0/4/3/8/8/9/7/4</code></div>
                            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                                <input id="extBotBuild" type="text" placeholder="0/4/3/8/8/9/7/4" style="flex:1;min-width:140px;padding:7px 10px;border-radius:8px;border:1px solid rgba(56,189,248,0.25);background:#0a0f1e;color:#e2e8f0;font-size:12px;font-family:monospace;">
                                <button type="button" id="extBotBuildApply" style="padding:7px 12px;border-radius:8px;font-weight:700;cursor:pointer;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.4);color:#38bdf8;">Apply</button>
                                <button type="button" id="extBotBuildClear" style="padding:7px 12px;border-radius:8px;font-weight:600;cursor:pointer;background:rgba(148,163,184,0.08);border:1px solid rgba(148,163,184,0.25);color:#94a3b8;">Default</button>
                            </div>
                            <div id="extBotBuildStatus" style="margin-top:6px;font-size:11px;color:#64748b;"></div>
                        </div>
                    </div>

                    <!-- Settings Grid -->
                    <div style="margin-bottom:12px;">
                        <div style="font-size:10px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#38bdf8;margin-bottom:8px;">Bot controls</div>
                        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;font-size:11px;">
                            <label class="ext-tog" title="Bots follow mouse aim/move"><input id="extMbs" type="checkbox" checked> Follow Mouse</label>
                            <label class="ext-tog" title="Feed mode (RMB hold + no shoot)"><input id="extFeeding" type="checkbox"> Feeding</label>
                            <label class="ext-tog"><input id="extAutoRespawn" type="checkbox" checked> Auto Respawn</label>
                            <label class="ext-tog" title="Toggle E on bots"><input id="extAutofire" type="checkbox"> Auto Fire (E)</label>
                            <label class="ext-tog"><input id="extHoldRmb" type="checkbox"> Hold RMB</label>
                            <label class="ext-tog" title="Toggle C on bots"><input id="extSpin" type="checkbox"> Spin (C)</label>
                            <label class="ext-tog" title="Toggle R on bots"><input id="extOverride" type="checkbox"> Override (R)</label>
                            <label class="ext-tog" title="8-dir weave while moving"><input id="extWavy" type="checkbox" checked> Wavy Move</label>
                            <label class="ext-tog" title="Bots aim the same direction you aim (up/up, left/left)"><input id="extCopyAim" type="checkbox" checked> Copy Aim</label>
                            <label class="ext-tog"><input id="extNoMove" type="checkbox"> No Move</label>
                            <label class="ext-tog"><input id="extNoAim" type="checkbox"> No Aim</label>
                            <label class="ext-tog" title="Offset bots into a formation shape"><input id="extFormationEnabled" type="checkbox"> Formation</label>
                        </div>
                    </div>

                    <!-- Formation Section -->
                    <div id="extFormationSection" style="display:none;margin-bottom:10px;">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                            <div>
                                <label style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Formation Type</label>
                                <select id="extFormationType" style="width:100%;margin-top:3px;padding:4px 6px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;box-sizing:border-box;">
                                    <option value="line_front">Line (Front)</option>
                                    <option value="line_behind">Line (Behind)</option>
                                    <option value="line_top">Line (Top)</option>
                                    <option value="line_bottom">Line (Bottom)</option>
                                    <option value="circle">Circle</option>
                                    <option value="star">Star</option>
                                    <option value="heart">Heart</option>
                                    <option value="text">Text</option>
                                </select>
                            </div>
                            <div id="extFormationTextWrap" style="margin-top:6px;">
                                <label style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Text (for Text formation)</label>
                                <input id="extFormationText" type="text" maxlength="12" placeholder="PR" style="width:100%;margin-top:3px;padding:4px 6px;border-radius:8px;border:1px solid rgba(148,163,184,0.15);background:#0a0f1e;color:#e2e8f0;font-size:11px;box-sizing:border-box;">
                            </div>
                            <div>
                                <label style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Spacing: <span id="extFormationSpacingVal" style="color:#60a5fa;">60</span></label>
                                <input type="range" id="extFormationSpacing" min="0" max="400" step="10" value="60" style="width:100%;margin-top:3px;">
                            </div>
                        </div>
                    </div>

                    <!-- Spawn Controls -->
                    <div style="background:rgba(59,130,246,0.04);border:1px solid rgba(59,130,246,0.1);border-radius:6px;padding:8px;margin-bottom:10px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                            <span style="font-size:11px;font-weight:bold;color:#3b82f6;">Quick Spawn</span>
                            <div style="display:flex;gap:3px;">
                                <button id="extSpawnAll1" style="padding:4px 10px;font-size:11px;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.3);color:#3b82f6;border-radius:3px;cursor:pointer;">+1</button>
                                <button id="extSpawnAll5" style="padding:4px 10px;font-size:11px;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.3);color:#3b82f6;border-radius:3px;cursor:pointer;">+5</button>
                                <button id="extSpawnAll10" style="padding:4px 10px;font-size:11px;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.3);color:#3b82f6;border-radius:3px;cursor:pointer;">+10</button>
                                <button id="extKillAll" style="padding:4px 10px;font-size:11px;background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.4);color:#f87171;border-radius:3px;cursor:pointer;">Kill All</button>
                                <button id="extForceRespawn" style="padding:4px 10px;font-size:11px;background:rgba(217,119,6,0.15);border:1px solid rgba(217,119,6,0.4);color:#fbbf24;border-radius:3px;cursor:pointer;">Respawn</button>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                            <label style="font-size:10px;color:#64748b;">Spawn Mode:</label>
                            <select id="extSpawnMode" style="flex:1;padding:4px 6px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;">
                                <option value="hybrid">Hybrid (Protocol+VM)</option>
                                <option value="protocol">Full Protocol</option>
                            </select>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <input id="extCustomCount" type="number" value="50" min="1" max="500" style="width:55px;padding:4px 6px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:12px;">
                            <button id="extSpawnCustom" style="padding:4px 12px;font-size:11px;background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.3);color:#60a5fa;border-radius:3px;cursor:pointer;">Spawn Custom</button>
                        </div>
                    </div>

                    <!-- Defender Spawn -->
                    <div style="background:rgba(34,197,94,0.04);border:1px solid rgba(34,197,94,0.15);border-radius:6px;padding:8px;margin-bottom:10px;">
                        <div style="font-size:11px;font-weight:bold;color:#4ade80;margin-bottom:4px;">Defender</div>
                        <div style="opacity:0.6;font-size:10px;margin-bottom:6px;">Rotates octo / gale / automingler. Always stays near you — ignores formation, manual coords, and hunt targeting.</div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <input id="extDefenderCount" type="number" value="10" min="1" max="500" style="width:55px;padding:4px 6px;border-radius:3px;border:1px solid rgba(34,197,94,0.25);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:12px;">
                            <button id="extSpawnDefender" style="padding:4px 12px;font-size:11px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);color:#4ade80;border-radius:3px;cursor:pointer;">Spawn Defenders</button>
                        </div>
                    </div>

                    <!-- Per-Server Controls -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
                        <div style="background:rgba(59,130,246,0.04);border:1px solid rgba(59,130,246,0.1);border-radius:4px;padding:5px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                                <span style="font-size:10px;font-weight:600;color:#94a3b8;">Server 1 <span style="color:#4ade80;font-family:monospace;">live:<span id="extLiveS0">—</span></span></span>
                                <button id="extKill1" style="padding:1px 6px;font-size:9px;background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.3);color:#f87171;border-radius:2px;cursor:pointer;"></button>
                            </div>
                            <div style="display:flex;gap:2px;">
                                <button id="extSpawn1s1" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+1</button>
                                <button id="extSpawn5s1" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+5</button>
                                <button id="extSpawn10s1" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+10</button>
                            </div>
                        </div>
                        <div style="background:rgba(59,130,246,0.04);border:1px solid rgba(59,130,246,0.1);border-radius:4px;padding:5px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                                <span style="font-size:10px;font-weight:600;color:#94a3b8;">Server 2 <span style="color:#4ade80;font-family:monospace;">live:<span id="extLiveS1">—</span></span></span>
                                <button id="extKill2" style="padding:1px 6px;font-size:9px;background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.3);color:#f87171;border-radius:2px;cursor:pointer;"></button>
                            </div>
                            <div style="display:flex;gap:2px;">
                                <button id="extSpawn1s2" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+1</button>
                                <button id="extSpawn5s2" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+5</button>
                                <button id="extSpawn10s2" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+10</button>
                            </div>
                        </div>
                        <div style="background:rgba(59,130,246,0.04);border:1px solid rgba(59,130,246,0.1);border-radius:4px;padding:5px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                                <span style="font-size:10px;font-weight:600;color:#94a3b8;">Server 3 <span style="color:#4ade80;font-family:monospace;">live:<span id="extLiveS2">—</span></span></span>
                                <button id="extKill3" style="padding:1px 6px;font-size:9px;background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.3);color:#f87171;border-radius:2px;cursor:pointer;"></button>
                            </div>
                            <div style="display:flex;gap:2px;">
                                <button id="extSpawn1s3" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+1</button>
                                <button id="extSpawn5s3" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+5</button>
                                <button id="extSpawn10s3" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+10</button>
                            </div>
                        </div>
                        <div style="background:rgba(59,130,246,0.04);border:1px solid rgba(59,130,246,0.1);border-radius:4px;padding:5px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                                <span style="font-size:10px;font-weight:600;color:#94a3b8;">Server 4 <span style="color:#4ade80;font-family:monospace;">live:<span id="extLiveS3">—</span></span></span>
                                <button id="extKill4" style="padding:1px 6px;font-size:9px;background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.3);color:#f87171;border-radius:2px;cursor:pointer;"></button>
                            </div>
                            <div style="display:flex;gap:2px;">
                                <button id="extSpawn1s4" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+1</button>
                                <button id="extSpawn5s4" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+5</button>
                                <button id="extSpawn10s4" style="flex:1;padding:3px 0;font-size:10px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#3b82f6;border-radius:2px;cursor:pointer;">+10</button>
                            </div>
                        </div>
                    </div>

                    <!-- Custom Servers -->
                    <div style="background:rgba(59,130,246,0.04);border:1px solid rgba(59,130,246,0.1);border-radius:6px;padding:8px;margin-bottom:10px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;gap:8px;flex-wrap:wrap;">
                            <span style="font-size:11px;font-weight:bold;color:#3b82f6;">Custom Servers</span>
                            <button type="button" id="extReconnectAll" title="Connect / reconnect every listed server" style="padding:6px 12px;font-size:11px;font-weight:700;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.45);color:#4ade80;border-radius:8px;cursor:pointer;white-space:nowrap;">Connect All</button>
                        </div>
                        <div style="display:flex;gap:4px;margin-bottom:6px;">
                            <input id="extCustomServerName" placeholder="Name" style="width:70px;padding:4px 6px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;">
                            <textarea id="extCustomServerUrl" placeholder="paste multiple URLs, one per line" rows="3" style="flex:1;padding:4px 6px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;resize:vertical;font-family:inherit;"></textarea>
                            <button id="extAddServer" style="padding:4px 10px;font-size:11px;background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.3);color:#60a5fa;border-radius:3px;cursor:pointer;white-space:nowrap;">Add</button>
                        </div>
                        <div id="extCustomServerList" style="max-height:80px;overflow-y:auto;font-size:10px;"></div>
                    </div>

                    <!-- Chat -->
                    <div style="display:flex;gap:4px;margin-bottom:10px;">
                        <input id="extChatMsg" placeholder="message..." style="flex:1;padding:4px 8px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;">
                        <button id="extChatSend" style="padding:4px 10px;font-size:11px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);color:#3b82f6;border-radius:3px;cursor:pointer;"></button>
                        <button id="extChatSpam" style="padding:4px 10px;font-size:11px;background:rgba(217,119,6,0.1);border:1px solid rgba(217,119,6,0.25);color:#fbbf24;border-radius:3px;cursor:pointer;"></button>
                        <button id="extChatStop" style="padding:4px 10px;font-size:11px;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.25);color:#f87171;border-radius:3px;cursor:pointer;"></button>
                    </div>

                    <!-- Hunt name -->
                    <div style="margin-bottom:10px;">
                        <div style="font-size:10px;color:#64748b;margin-bottom:4px;">Hunt name</div>
                        <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
                            <input id="extHuntName" placeholder="player name..." style="flex:1;min-width:100px;padding:4px 8px;border-radius:3px;border:1px solid rgba(248,113,113,0.25);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;">
                            <input id="extHuntCount" type="number" min="0" max="2000" value="10" title="Bots to spawn (0 = existing only)" style="width:64px;padding:4px 6px;border-radius:3px;border:1px solid rgba(248,113,113,0.25);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;">
                            <button id="extHuntGo" style="padding:4px 10px;font-size:11px;background:rgba(248,113,113,0.15);border:1px solid rgba(248,113,113,0.4);color:#f87171;border-radius:3px;cursor:pointer;white-space:nowrap;">Hunt</button>
                            <button id="extHuntStop" style="padding:4px 10px;font-size:11px;background:rgba(148,163,184,0.12);border:1px solid rgba(148,163,184,0.3);color:#94a3b8;border-radius:3px;cursor:pointer;">Stop</button>
                        </div>
                        <div style="font-size:9px;color:#64748b;margin-top:3px;">Count = spawn then hunt (0 = lock existing bots only)</div>
                    </div>

                    <!-- Aim Sensitivity -->
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                        <span style="font-size:10px;color:#64748b;white-space:nowrap;">Sensitivity</span>
                        <input type="range" id="extSensitivity" min="1" max="100" step="1" value="20" style="flex:1;">
                        <span id="extSensitivityValue" style="min-width:24px;text-align:right;color:#60a5fa;font-weight:bold;font-size:11px;">20</span>
                    </div>

                    <!-- Manual Coords -->
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                        <label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input id="extManualMode" type="checkbox" style="accent-color:#3b82f6;"> Manual Coords</label>
                        <div id="extManualCoordsSection" style="display:none;flex:1;display:flex;gap:4px;">
                            <input id="extManualX" type="number" value="0" placeholder="X" style="width:60px;padding:3px 6px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;">
                            <input id="extManualY" type="number" value="0" placeholder="Y" style="width:60px;padding:3px 6px;border-radius:3px;border:1px solid rgba(59,130,246,0.18);background:rgba(2,6,14,0.8);color:#e2e8f0;font-size:11px;">
                        </div>
                    </div>

                    <!-- Sing / Karaoke -->
                    <div class="ext-panel" style="margin-bottom:12px;">
                        <div class="ext-panel-title">Sing (full lyrics)</div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;align-items:center;">
                            <button type="button" id="extSingStart" style="padding:7px 12px;font-weight:700;border-radius:8px;cursor:pointer;background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.45);color:#c084fc;">Start Sing</button>
                            <button type="button" id="extSingStop" style="padding:7px 12px;font-weight:700;border-radius:8px;cursor:pointer;background:rgba(148,163,184,0.1);border:1px solid rgba(148,163,184,0.3);color:#94a3b8;">Stop</button>
                            <label style="font-size:11px;color:#94a3b8;display:flex;align-items:center;gap:6px;">Delay
                                <input id="extSingDelay" type="number" min="1500" max="15000" step="500" value="4000" style="width:72px;padding:5px 8px;border-radius:8px;border:1px solid rgba(168,85,247,0.3);background:#0a0f1e;color:#e2e8f0;font-size:11px;">
                                <span style="opacity:0.7;">ms</span>
                            </label>
                        </div>
                        <div style="font-size:10px;color:#64748b;margin-bottom:6px;">Full song — each line is one bot chat message. Edit freely.</div>
                        <textarea id="extSingLyrics" rows="14" spellcheck="false" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid rgba(168,85,247,0.25);background:#070b14;color:#e9d5ff;font-size:11px;line-height:1.45;font-family:'Share Tech Mono',ui-monospace,monospace;resize:vertical;"></textarea>
                        <div id="extSingStatus" style="margin-top:6px;font-size:11px;color:#64748b;">Idle</div>
                    </div>

                    <!-- Terminal -->
                    <div style="margin-bottom:6px;">
                        <span style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Terminal</span>
                    </div>
                    <div id="extTerminal" style="font-family:'Share Tech Mono',monospace;font-size:10px;line-height:1.4;color:#60a5fa;background:#050a05;border:1px solid rgba(96,165,250,0.2);border-radius:4px;padding:6px 8px;height:100px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;"><span class="term-line term-dim">$ connecting to servers...<span class="term-cursor">_</span></span></div>
                </div>
                <div id="menu-sbx" style="display:none">
                    Sandbox tools <input id="sandboxTools" type=checkbox></p>
                    No reload:
                        <select id="noReloadSelect">
                            <option value="disabled">Disabled</option>
                            <option value="engineer">Engineer</option>
                            <option value="surgeon">Surgeon</option>
                            <option value="launchers">Launchers</option>
                            <option value="builders">Builders</option>
                        </select>
                    </p>
                    <button id="setSpawn">Set spawnpoint</button></p>
                    healing \`+H <input id="sbxHeal" type=checkbox></p>
                    <br/>
                    <b>Keys (sandbox tools):</b><br/>
                    1 - spawn Unknown Entity<br/>
                    2 - fast walls<br/>
                    6+8 - clear everything<br/>
                    hold mouse for no reload
                </div>
                <div id="menu-fed" style="display:none">
                    feed-bot lol<br/>
                    goes across custom path, autorespawns.<br/>
                    press L first so script knows ur location.
                    Enabled <input id="doFed" type=checkbox></p>
                    <button id="addFedLocation">Add location here</button></p>
                    <button id="resetFedPath">Reset path</button></p>
                </div>
                <div id="menu-visual" style="display:none">
                    Change rendering to Canvas2D first.
                    X-Ray <input id="xray" type=checkbox></p>
                    <input type="range" id="xrayAlpha" min="0" max="1" step="0.05" value="0.5"><br/>
                    Remove transparency <input id="seeEverything" type=checkbox></p>
                    <div class="h-separator"></div>
                    Hide Bullets <input id="bulletHider" type=checkbox></p>
                    <p style="opacity:0.6;font-size:11px;">Hides all bullet/projectile renders. Helps fps when spamming bots.</p>
                    <span style="font-size:11px;">Radius threshold: <span id="bulletHiderThreshVal">14</span>px</span><br/>
                    <input type="range" id="bulletHiderThresh" min="4" max="30" step="1" value="14">
                    <p style="opacity:0.6;font-size:11px;">Lower = only tiny bullets hidden. Raise it and small tanks start disappearing too — if bodies vanish, lower this.</p>
                    <div class="h-separator"></div>
                    Hide Assist Messages <input id="hideAssistMsgs" type=checkbox></p>
                    <p style="opacity:0.6;font-size:11px;">Hides "You assisted..." / "You assissted..." popup text. Saves FPS when farming bots.</p>
                    Hide Kill Messages <input id="hideKillMsgs" type=checkbox></p>
                    <p style="opacity:0.6;font-size:11px;">Hides "You killed..." popup text. Saves FPS when farming bots.</p>
                </div>
                <div id="menu-other" style="display:none">
                    <button id="pibuild">Do PI build</button>
                    <button id="resetAuthBtn" style="background:#dc2626;">Reset Authorization</button>
                    Detected FOV: <span id="fovDisplay" style="font-weight:bold;color:#60a5fa;">--</span></p>
                    <h4 style="margin:6px 0 3px"> Leaked clan tags</h4>
                    <textarea id="stealedClans" style="width:100%;height:60px;">Nothing for now</textarea>
                    <div class="h-separator"></div>
                    <h4 style="margin:6px 0 3px">Extras</h4>
                    Tank:
                        <select id="extraTankSelect">
                            <option value="fireworks">Fireworks (khky)</option>
                            <option value="ultraspawn">Ultra Spawner</option>
                            <option value="brig">Brig</option>
                            <option value="overczar">Overczar</option>
                            <option value="pursuer">Pursuer</option>
                            <option value="auto4feed">Auto-4 (feed)</option>
                            <option value="phys">Physician</option>
                        </select>
                    </p>
                    <button id="extraUpgradeBtn">Upgrade</button></p>
                </div>
                <div id="menu-keys" style="display:none">
                    <p style="opacity:0.7;font-size:12px;margin:0 0 8px;">Full keyboard shown at bottom of screen. Supports multi-touch.</p>
                    <p style="opacity:0.6;font-size:11px;">Useful keys in arras:<br/>
                    <b>&#96;</b> = command mode &nbsp; <b>L</b> = coords<br/>
                    <b>E</b> = suicide &nbsp; <b>N</b> = lvl up<br/>
                    <b>1-9</b> = stats &nbsp; <b>H-M</b> = tank upgrades</p>
                </div>
                <div id="menu-status" style="display:none">
                    <b>Live Status</b>
                    Role: <span id="pr_stat_role">Solo</span></p>
                    Position: <span id="pr_stat_pos">(0, 0)</span></p>
                    FOV: <span id="pr_stat_fov">--</span></p>
                    Swarm: <span id="pr_stat_swarm">1 tabs</span></p>
                    Status: <span id="pr_stat_status">Lobby</span></p>
                    <div class="h-separator"></div>
                    <b>Force Respawn All Bots</b>
                    Build:
                        <select id="pr_respawn_build_sel" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:4px 8px;color:white;font-size:12px;">
                            <option value="none">None (Basic)</option>
                            <option value="gale">Gale (H-Y-K-I)</option>
                            <option value="limpet">Limpet (X-Space)</option>
                        </select>
                        <button id="pr_force_respawn_btn">Respawn All</button>
                    </p>
                    <div class="h-separator"></div>
                  <div class="h-separator"></div>
<b>Formation</b>
Enable <input id="pr_formation_enabled" type=checkbox></p>
Type:
    <select id="pr_formation_type" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:4px 8px;color:white;font-size:12px;">
        <option value="behind">Behind (V-Shape)</option>
        <option value="front">Front (V-Shape)</option>
        <option value="line">Line (Both Sides)</option>
        <option value="line_front">Line (Front)</option>
        <option value="line_behind">Line (Behind)</option>
        <option value="tight">Tight (Stack)</option>
        <option value="circle">Circle (Surround)</option>
        <option value="star">Star</option>
        <option value="heart">Heart</option>
        <option value="text">Text</option>
        <option value="arc_front">Arc (Front)</option>
        <option value="arc_behind">Arc (Behind)</option>
        <option value="diamond">Diamond</option>
        <option value="wedge">Wedge (Arrow)</option>
        <option value="double_line">Double Line</option>
        <option value="grid">Grid (Box)</option>
        <option value="spiral">Spiral</option>
        <option value="random_scatter">Scatter</option>
    </select>
</p>
Spacing:
    <button class="slider-btn" data-target="pr_formation_spacing" data-delta="-10">−</button>
    <input type="range" id="pr_formation_spacing" min="0" max="400" value="60" style="width:120px;vertical-align:middle;">
    <button class="slider-btn" data-target="pr_formation_spacing" data-delta="10">+</button>
    <span id="pr_formation_spacing_val">60</span>
</p>
Follow distance:
    <button class="slider-btn" data-target="pr_follow_dist" data-delta="-5">−</button>
    <input type="range" id="pr_follow_dist" min="0" max="300" value="0" style="width:120px;vertical-align:middle;">
    <button class="slider-btn" data-target="pr_follow_dist" data-delta="5">+</button>
    <span id="pr_follow_dist_val">0</span>
</p>
                </div>
                <div id="menu-killlog" style="display:none">
                    <b>Kill Log</b> — <span id="pr_kill_count">0</span> kills
                    <button id="pr_clear_kills">Clear</button></p>
                    <div id="pr_kill_log" style="max-height:200px;overflow-y:auto;padding:4px 0;"></div>
                </div>
                <div id="menu-username" style="display:none">
                    <b>Auto Username</b>
                    Enable <input id="pr_auto_username" type=checkbox></p>
                    Theme:
                        <select id="pr_username_theme" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:4px 8px;color:white;font-size:12px;">
                            <option value="legit">Legit Names</option>
                            <option value="random">Random Letters</option>
                        </select>
                    </p>
                    <button id="pr_set_username_now">Set Random Name Now</button></p>
                    Precise Aim <input id="pr_precise_aim" type=checkbox></p>
                </div>
                <div id="menu-chatmsg" style="display:none">
                    <b>Chat Messages</b>
                    Message 1:<br><input id="pr_chat_msg1" style="width:100%;margin-top:4px;" placeholder="Chat message 1..."></p>
                    Message 2:<br><input id="pr_chat_msg2" style="width:100%;margin-top:4px;" placeholder="Chat message 2..."></p>
                    <button id="pr_send_chat_now">Send Now (P key)</button></p>
                </div>
                <div id="menu-perf" style="display:none">
                    <b>Performance</b>
                    FPS Limiter (follower mobile) <input id="pr_fps_enabled" type=checkbox></p>
                    FPS limit: <input type="range" id="pr_fps_limit" min="1" max="120" value="30" style="width:120px;"> <span id="pr_fps_val">30</span></p>
                    <p style="opacity:0.6;font-size:11px;">Limits requestAnimationFrame rate. Lower = less CPU. Useful when using mobile tabs as followers.</p>
                </div>
                <div id="menu-macros" style="display:none">
                    <b>Bot Macros</b>
                    <p style="opacity:0.6;font-size:11px;margin:4px 0 8px;">Runs tank upgrade path + stat build on bots via localStorage botCommand.</p>
                    <div id="pr_macro_grid" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;"></div>
                    <p style="font-size:11px;color:#aaa;">Last used: <span id="pr_last_macro_label" style="color:#60a5fa;">One way</span></p>
                </div>
                <div id="menu-tutor" style="display:none">
                    <b>Stacking</b><br/>
                    Choose tank, enable Stacking (X to toggle), shoot.<br/>
                    Tanks with * have anti-stack outside Arms Race.<br/><br/>
                    <b>Botting</b><br/>
                    Botting tab → Create → press L in bot window.<br/>
                    Mouse aim mode: bots aim at same world point.<br/><br/>
                    <b>Other</b><br/>
                    <kbd>,</kbd> or <kbd>G</kbd> to upgrade tank.<br/>
                    PI build → enable secret options in arras settings.
                </div>
            </div>
            <div id="authBadge">${authRole === 'owner' ? 'Owner' : 'PR Member'}</div>`;

            document.body.appendChild(menu);

            // Populate macro grid
            const _macroGrid = document.getElementById("pr_macro_grid");
            const _macroLastLabel = document.getElementById("pr_last_macro_label");
            if (_macroGrid) {
                Object.keys(MACROS).forEach(mName => {
                    const btn = document.createElement("button");
                    btn.textContent = mName;
                    Object.assign(btn.style, {
                        padding: "7px 4px", fontSize: "11px", fontWeight: "600",
                        background: "rgba(59,130,246,0.25)", border: "1px solid rgba(59,130,246,0.5)",
                        borderRadius: "10px", color: "white", cursor: "pointer", transition: "0.2s"
                    });
                    btn.addEventListener("mouseenter", () => btn.style.background = "rgba(59,130,246,0.6)");
                    btn.addEventListener("mouseleave", () => btn.style.background = "rgba(59,130,246,0.25)");
                    btn.addEventListener("click", () => {
                        _lastMacroName = mName;
                        localStorage.setItem("pr_lastMacroName", mName);
                        if (_macroLastLabel) _macroLastLabel.textContent = mName;
                        // update tank + pendingMacro on all existing bots so respawn uses new macro
                        for (const bot of bots) {
                            try {
                                bot.contentWindow.channel.tank = "none";
                                bot.contentWindow.channel.pendingMacro = mName;
                            } catch(e) {}
                        }
                        // broadcast to iframe bots via channel.message
                        botsMsg({ type: 'upgrade', macro: mName });
                        // also hit localStorage for any separate-tab bots
                        localStorage.setItem("botCommand", JSON.stringify({ type: 'upgrade', macro: mName, timestamp: Date.now(), id: Math.random() }));
                        performMacroUpgrade(mName);
                    });
                    _macroGrid.appendChild(btn);
                });
                if (_macroLastLabel) _macroLastLabel.textContent = _lastMacroName;
            }

            const menuToggleBtn = document.createElement("button");
            menuToggleBtn.id = "prMenuToggleBtn";
            menuToggleBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            `;
            Object.assign(menuToggleBtn.style, {
                position: "fixed",
                bottom: "22px",
                right: "22px",
                zIndex: "9999999",
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(8, 14, 28, 0.98))",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                color: "#38bdf8",
                cursor: "pointer",
                backdropFilter: "blur(14px)",
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.25)",
                pointerEvents: "auto",
                touchAction: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
            });
            menuToggleBtn.onmouseover = () => {
                menuToggleBtn.style.transform = "scale(1.08) translateY(-2px)";
                menuToggleBtn.style.borderColor = "#38bdf8";
                menuToggleBtn.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.6), 0 0 22px rgba(56, 189, 248, 0.4)";
            };
            menuToggleBtn.onmouseout = () => {
                menuToggleBtn.style.transform = "scale(1) translateY(0)";
                menuToggleBtn.style.borderColor = "rgba(56, 189, 248, 0.35)";
                menuToggleBtn.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.25)";
            };
            menuToggleBtn.addEventListener("touchstart", (e) => {
                e.stopPropagation();
                e.preventDefault();
                const m = getEl("scriptMenu");
                if (m) m.style.display = m.style.display === "flex" ? "none" : "flex";
            }, { passive: false });
            menuToggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const m = getEl("scriptMenu");
                if (m) m.style.display = m.style.display === "flex" ? "none" : "flex";
            });
            document.body.appendChild(menuToggleBtn);

            const JOYSTICK_R = 55;
            const KNOB_R = 25;
            const DEAD_ZONE = 35;
            const JS_SIZE = (JOYSTICK_R + KNOB_R) * 2;

            const wasdPad = document.createElement("div");
            wasdPad.id = "wasdPad";
            Object.assign(wasdPad.style, {
                position: "fixed",
                bottom: "80px",
                left: "120px",
                width: JS_SIZE + "px",
                height: JS_SIZE + "px",
                zIndex: "9999998",
                userSelect: "none",
                touchAction: "none",
                opacity: "0.6"
            });

            const jsBase = document.createElement("div");
            Object.assign(jsBase.style, {
                position: "absolute",
                width: JS_SIZE + "px",
                height: JS_SIZE + "px",
                borderRadius: "50%",
                background: "rgba(12,12,20,0.55)",
                border: "2px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(6px)",
                boxSizing: "border-box"
            });

            const jsKnob = document.createElement("div");
            const kSize = KNOB_R * 2;
            Object.assign(jsKnob.style, {
                position: "absolute",
                width: kSize + "px",
                height: kSize + "px",
                borderRadius: "50%",
                background: "rgba(59,130,246,0.75)",
                border: "2px solid rgba(255,255,255,0.4)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                left: (JS_SIZE / 2 - KNOB_R) + "px",
                top: (JS_SIZE / 2 - KNOB_R) + "px",
                transition: "left 0.05s, top 0.05s",
                boxSizing: "border-box"
            });

            wasdPad.appendChild(jsBase);
            wasdPad.appendChild(jsKnob);
            document.body.appendChild(wasdPad);

            let jsTouchId = null;
            let jsOriginX = 0, jsOriginY = 0;
            let jsActiveKeys = new Set();

            function jsSetKeys(dx, dy) {
                const newKeys = new Set();
                if (dx >  DEAD_ZONE) newKeys.add("KeyD");
                if (dx < -DEAD_ZONE) newKeys.add("KeyA");
                if (dy >  DEAD_ZONE) newKeys.add("KeyS");
                if (dy < -DEAD_ZONE) newKeys.add("KeyW");
                jsActiveKeys.forEach(k => { if (!newKeys.has(k)) { events.keyUp(k); } });
                newKeys.forEach(k => { if (!jsActiveKeys.has(k)) { events.keyDown(k); } });
                jsActiveKeys = newKeys;
            }

            function jsMoveKnob(dx, dy) {
                const dist = Math.hypot(dx, dy);
                const clamped = Math.min(dist, JOYSTICK_R);
                const angle = Math.atan2(dy, dx);
                jsKnob.style.transition = "none";
                jsKnob.style.left = (JS_SIZE / 2 - KNOB_R + Math.cos(angle) * clamped) + "px";
                jsKnob.style.top  = (JS_SIZE / 2 - KNOB_R + Math.sin(angle) * clamped) + "px";
            }

            function jsReset() {
                jsKnob.style.transition = "left 0.1s, top 0.1s";
                jsKnob.style.left = (JS_SIZE / 2 - KNOB_R) + "px";
                jsKnob.style.top  = (JS_SIZE / 2 - KNOB_R) + "px";
                jsActiveKeys.forEach(k => { events.keyUp(k); });
                jsActiveKeys = new Set();
                jsTouchId = null;
            }

            wasdPad.addEventListener("touchstart", (e) => {
                e.preventDefault(); e.stopPropagation();
                if (jsTouchId !== null) return;
                const t = e.changedTouches[0];
                jsTouchId = t.identifier;
                const r = wasdPad.getBoundingClientRect();
                jsOriginX = r.left + JS_SIZE / 2;
                jsOriginY = r.top  + JS_SIZE / 2;
                const dx = t.clientX - jsOriginX;
                const dy = t.clientY - jsOriginY;
                jsMoveKnob(dx, dy);
                jsSetKeys(dx, dy);
            }, { passive: false });

            wasdPad.addEventListener("touchmove", (e) => {
                e.preventDefault();
                for (const t of e.changedTouches) {
                    if (t.identifier !== jsTouchId) continue;
                    const dx = t.clientX - jsOriginX;
                    const dy = t.clientY - jsOriginY;
                    jsMoveKnob(dx, dy);
                    jsSetKeys(dx, dy);
                }
            }, { passive: false });

            wasdPad.addEventListener("touchend",    (e) => { e.preventDefault(); for (const t of e.changedTouches) { if (t.identifier === jsTouchId) jsReset(); } }, { passive: false });
            wasdPad.addEventListener("touchcancel", () => jsReset(), { passive: false });

            const _ourElementIds = new Set(['scriptMenu','mouseButtons','wasdPad','menuToggleBtn','kbOverlay']);
            function removeJoysticks() {
                document.querySelectorAll('body > div, body > canvas ~ div').forEach(el => {
                    if (_ourElementIds.has(el.id)) return;
                    if (el === menu || el === wasdPad || el === mouseButtonsDiv || el === menuToggleBtn || el === cursor || el === kbOverlay) return;
                    const s = el.style;
                    const isCircle = s.borderRadius === '50%' || s.borderRadius === '50vh' || (s.width && s.height && s.width === s.height && (s.borderRadius || '').includes('50'));
                    const isOverlay = s.position === 'fixed' || s.position === 'absolute';
                    if (isCircle || (isOverlay && el.tagName === 'DIV' && !el.id.includes('script') && !el.id.includes('auth') && !el.id.includes('drag') && !el.id.includes('bot'))) {
                        const w = parseInt(s.width);
                        if (!isNaN(w) && w > 80) el.style.display = 'none';
                    }
                });
            }
            removeJoysticks();
            new MutationObserver(() => removeJoysticks()).observe(document.body, { childList: true, subtree: false, attributes: true, attributeFilter: ['style'] });

            const mouseButtonsDiv = document.createElement("div");
            mouseButtonsDiv.id = "mouseButtons";

            const _mbSaved = {};
            let _mbBtnW  = 76;
            let _mbBtnH  = 48;
            let _mbLeft  = 20;
            let _mbBottom = 226;
            try { localStorage.removeItem('pr_mb_pos'); } catch(e) {}

            Object.assign(mouseButtonsDiv.style, {
                position: "fixed",
                bottom: _mbBottom + "px",
                left: _mbLeft + "px",
                zIndex: "9999998",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                userSelect: "none",
                touchAction: "none",
                cursor: "grab",
                opacity: "0.45"
            });

            const _mbInner = document.createElement("div");
            Object.assign(_mbInner.style, { display: "flex", gap: "4px", touchAction: "none" });

            const _mbDragBar = document.createElement("div");
            _mbDragBar.innerText = " drag";
            Object.assign(_mbDragBar.style, {
                width: "100%",
                height: "20px",
                borderRadius: "8px 8px 0 0",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.5)",
                fontSize: "10px",
                textAlign: "center",
                lineHeight: "20px",
                cursor: "grab",
                userSelect: "none",
                touchAction: "none",
                boxSizing: "border-box"
            });

            const _mbResizeBar = document.createElement("div");
            _mbResizeBar.innerText = "⇔ resize";
            Object.assign(_mbResizeBar.style, {
                width: "100%",
                height: "20px",
                borderRadius: "0 0 8px 8px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderTop: "none",
                color: "rgba(255,255,255,0.4)",
                fontSize: "10px",
                textAlign: "center",
                lineHeight: "20px",
                cursor: "ew-resize",
                userSelect: "none",
                touchAction: "none",
                boxSizing: "border-box"
            });

            mouseButtonsDiv.appendChild(_mbDragBar);
            mouseButtonsDiv.appendChild(_mbInner);
            mouseButtonsDiv.appendChild(_mbResizeBar);

            function _mbSavePos() {
                try { localStorage.setItem('pr_mb_pos', JSON.stringify({ x: _mbLeft, y: _mbBottom, w: _mbBtnW, h: _mbBtnH })); } catch(e){}
            }

            function _mbApplySize() {
                _mbInner.querySelectorAll('button').forEach(b => {
                    b.style.width  = _mbBtnW + "px";
                    b.style.height = _mbBtnH + "px";
                    b.style.fontSize = Math.max(11, Math.round(_mbBtnH * 0.27)) + "px";
                });
            }

            let _mbDragging = false, _mbDragStartX, _mbDragStartY, _mbDragStartLeft, _mbDragStartBottom;

            function _mbDragStart(clientX, clientY) {
                _mbDragging = true;
                _mbDragStartX = clientX;
                _mbDragStartY = clientY;
                _mbDragStartLeft   = _mbLeft;
                _mbDragStartBottom = _mbBottom;
                _mbDragBar.style.cursor = "grabbing";
            }
            function _mbDragMove(clientX, clientY) {
                if (!_mbDragging) return;
                const dx = clientX - _mbDragStartX;
                const dy = clientY - _mbDragStartY;
                _mbLeft   = Math.max(0, Math.min(innerWidth  - 160, _mbDragStartLeft   + dx));
                _mbBottom = Math.max(0, Math.min(innerHeight - 120, _mbDragStartBottom - dy));
                mouseButtonsDiv.style.left   = _mbLeft   + "px";
                mouseButtonsDiv.style.bottom = _mbBottom + "px";
            }
            function _mbDragEnd() { _mbDragging = false; _mbDragBar.style.cursor = "grab"; _mbSavePos(); }

            _mbDragBar.addEventListener("mousedown",  (e) => { e.preventDefault(); _mbDragStart(e.clientX, e.clientY); });
            _mbDragBar.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); const t = e.touches[0]; _mbDragStart(t.clientX, t.clientY); }, { passive: false });
            document.addEventListener("mousemove",  (e) => { if (_mbDragging) _mbDragMove(e.clientX, e.clientY); });
            document.addEventListener("touchmove",  (e) => { if (_mbDragging) { const t = e.touches[0]; _mbDragMove(t.clientX, t.clientY); } }, { passive: true });
            document.addEventListener("mouseup",    () => { if (_mbDragging) _mbDragEnd(); });
            document.addEventListener("touchend",   () => { if (_mbDragging) _mbDragEnd(); });

            let _mbResizing = false, _mbResizeStartX, _mbResizeStartW, _mbResizeStartH;

            function _mbResizeStart(clientX) {
                _mbResizing = true;
                _mbResizeStartX = clientX;
                _mbResizeStartW = _mbBtnW;
                _mbResizeStartH = _mbBtnH;
                _mbResizeBar.style.cursor = "ew-resize";
            }
            function _mbResizeMove(clientX) {
                if (!_mbResizing) return;
                const dx = clientX - _mbResizeStartX;
                _mbBtnW = Math.max(48, Math.min(160, _mbResizeStartW + dx));
                _mbBtnH = Math.max(36, Math.min(120, _mbResizeStartH + Math.round(dx * 0.5)));
                _mbApplySize();
            }
            function _mbResizeEnd() { _mbResizing = false; _mbSavePos(); }

            _mbResizeBar.addEventListener("mousedown",  (e) => { e.preventDefault(); _mbResizeStart(e.clientX); });
            _mbResizeBar.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); _mbResizeStart(e.touches[0].clientX); }, { passive: false });
            document.addEventListener("mousemove",  (e) => { if (_mbResizing) _mbResizeMove(e.clientX); });
            document.addEventListener("touchmove",  (e) => { if (_mbResizing) { _mbResizeMove(e.touches[0].clientX); } }, { passive: true });
            document.addEventListener("mouseup",    () => { if (_mbResizing) _mbResizeEnd(); });
            document.addEventListener("touchend",   () => { if (_mbResizing) _mbResizeEnd(); });

            function makeMouseBtn(label, button, color) {
                const btn = document.createElement("button");
                btn.innerText = label;
                Object.assign(btn.style, {
                    width: _mbBtnW + "px",
                    height: _mbBtnH + "px",
                    borderRadius: "12px",
                    background: "rgba(12,12,20,0.85)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    color: "white",
                    fontSize: Math.max(11, Math.round(_mbBtnH * 0.27)) + "px",
                    fontWeight: "700",
                    cursor: "pointer",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    transition: "background 0.1s",
                    touchAction: "none"
                });
                const pressBtn = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    btn.style.background = color;
                    mouse.down = button === 0 ? true : mouse.down;
                    mouse.buttons[button] = true;
                    events.mouseDown(button, cursorX, cursorY);
                    if (button === 0) triggerStack();
                };
                const releaseBtn = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    btn.style.background = "rgba(12,12,20,0.85)";
                    mouse.down = button === 0 ? false : mouse.down;
                    mouse.buttons[button] = false;
                    stackRunning = false;
                    events.mouseUp(button, cursorX, cursorY);
                };
                btn.addEventListener("mousedown",   pressBtn,   { passive: false });
                btn.addEventListener("touchstart",  pressBtn,   { passive: false });
                btn.addEventListener("mouseup",     releaseBtn, { passive: false });
                btn.addEventListener("touchend",    releaseBtn, { passive: false });
                btn.addEventListener("mouseleave",  releaseBtn, { passive: false });
                btn.addEventListener("touchcancel", releaseBtn, { passive: false });
                _mbInner.appendChild(btn);
            }

            makeMouseBtn("LMB", 0, "rgba(59,130,246,0.8)");
            makeMouseBtn("RMB", 2, "rgba(239,68,68,0.8)");
            document.body.appendChild(mouseButtonsDiv);

            let _autoRmbInterval = null;
            let _autoRmbWatcher = null;
            document.getElementById("autoRMB")?.addEventListener("change", function() {
                if (this.checked) {
                    _autoRmbInterval = setInterval(() => {
                        botsMsg({ type: "mousedown", button: 2, x: mouse.x, y: mouse.y });
                    }, 100);
                    let _wasAlive = false;
                    _autoRmbWatcher = setInterval(() => {
                        const alive = spawned;
                        if (!_wasAlive && alive) botsMsg({ type: "mousedown", button: 2, x: mouse.x, y: mouse.y });
                        _wasAlive = alive;
                    }, 200);
                } else {
                    clearInterval(_autoRmbInterval);
                    clearInterval(_autoRmbWatcher);
                    _autoRmbInterval = null;
                    _autoRmbWatcher = null;
                    botsMsg({ type: "mouseup", button: 2, x: mouse.x, y: mouse.y });
                }
            });

            cursor = document.createElement("div");
            Object.assign(cursor.style, {
                position: "fixed",
                width: "32px",
                height: "32px",
                pointerEvents: "none",
                zIndex: "99999999",
                left: (innerWidth / 2) + "px",
                top: (innerHeight / 2) + "px",
                transform: "translate(-16px, -16px)"
            });
            cursor.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <line x1="16" y1="0" x2="16" y2="32" stroke="black" stroke-width="2.5"/>
                <line x1="0" y1="16" x2="32" y2="16" stroke="black" stroke-width="2.5"/>
                <line x1="16" y1="0" x2="16" y2="32" stroke="white" stroke-width="1"/>
                <line x1="0" y1="16" x2="32" y2="16" stroke="white" stroke-width="1"/>
                <circle cx="16" cy="16" r="3" fill="none" stroke="black" stroke-width="2"/>
                <circle cx="16" cy="16" r="3" fill="none" stroke="white" stroke-width="1"/>
            </svg>`;
            document.body.appendChild(cursor);

            kbOverlay = null;
            let joystickTouchId = null;
            let aimTouchId = null;
            let joystickOrigin = { x: 0, y: 0 };

            let aimLastX = 0, aimLastY = 0;
            let cursorX = innerWidth / 2, cursorY = innerHeight / 2;
            cursor.style.left = cursorX + "px";
            cursor.style.top  = cursorY + "px";

            const MOUSE_SPEED = 1.8;
            function moveCursorBy(dx, dy) {
                cursorX = Math.max(0, Math.min(innerWidth,  cursorX + dx * MOUSE_SPEED));
                cursorY = Math.max(0, Math.min(innerHeight, cursorY + dy * MOUSE_SPEED));
                cursor.style.left = cursorX + "px";
                cursor.style.top  = cursorY + "px";
                mouse.x = cursorX;
                mouse.y = cursorY;
            }

            function isJoystickZone(x, y) {
                return false;
            }

            const _ourTouchStart = e => {
                if (menu.contains(e.target) || menuToggleBtn.contains(e.target) || wasdPad.contains(e.target) || mouseButtonsDiv.contains(e.target) || (kbOverlay && kbOverlay.contains(e.target))) {
                    return;
                }
                e.__prHandled = true;
                e.preventDefault();
                for (const t of e.changedTouches) {
                    if (joystickTouchId === null && isJoystickZone(t.clientX, t.clientY)) {
                        joystickTouchId = t.identifier;
                        joystickOrigin.x = t.clientX;
                        joystickOrigin.y = t.clientY;
                    } else if (aimTouchId === null) {
                        aimTouchId = t.identifier;
                        aimLastX = t.clientX;
                        aimLastY = t.clientY;
                        mouse.x = cursorX; mouse.y = cursorY;
                        mouse.dir = utils.getDir(center.x, center.y, cursorX, cursorY);
                        events.moveTo(cursorX, cursorY);
                    }
                }
            };
            _ourTouchStart.__prScript = true;
            document.addEventListener('touchstart', _ourTouchStart, { passive: false, capture: true });

            const _ourTouchMove = e => {
                if (menu.contains(e.target) || menuToggleBtn.contains(e.target) || wasdPad.contains(e.target) || mouseButtonsDiv.contains(e.target) || (kbOverlay && kbOverlay.contains(e.target))) {
                    return;
                }
                e.__prHandled = true;
                for (const t of e.changedTouches) {
                    if (t.identifier === joystickTouchId) {
                        const dx = t.clientX - joystickOrigin.x;
                        const dy = t.clientY - joystickOrigin.y;
                        const dist = Math.hypot(dx, dy);
                        if (dist > 15) {
                            stopMoving();
                            dirPathfind(Math.atan2(dy, dx));
                            relayJoystickToBots(Math.atan2(dy, dx), true);
                        }
                    } else if (t.identifier === aimTouchId) {
                        const dx = t.clientX - aimLastX;
                        const dy = t.clientY - aimLastY;
                        aimLastX = t.clientX;
                        aimLastY = t.clientY;
                        moveCursorBy(dx, dy);
                        mouse.x = cursorX; mouse.y = cursorY;
                        mouse.dir = utils.getDir(center.x, center.y, cursorX, cursorY);
                        if (!mouse.lock) {
                            events.moveTo(cursorX, cursorY);
                        }
                        if (bots.length) {
                            const wx = player.x ? (cursorX - center.x) / center.x * globalFov + player.x : undefined;
                            const wy = player.y ? (cursorY - center.y) / center.y * (globalFov * (innerHeight / innerWidth)) + player.y : undefined;
                            botsMsg({ type: 'mousemove', x: cursorX, y: cursorY, innerWidth, innerHeight, worldX: wx, worldY: wy });
                        }
                    }
                }
            };
            _ourTouchMove.__prScript = true;
            document.addEventListener('touchmove', _ourTouchMove, { passive: false, capture: true });

            const _ourTouchEnd = e => {
                if (menu.contains(e.target) || menuToggleBtn.contains(e.target) || wasdPad.contains(e.target) || mouseButtonsDiv.contains(e.target) || (kbOverlay && kbOverlay.contains(e.target))) {
                    return;
                }
                e.__prHandled = true;
                e.preventDefault();
                for (const t of e.changedTouches) {
                    if (t.identifier === joystickTouchId) {
                        joystickTouchId = null;
                        stopMoving();
                        relayJoystickToBots(0, false);
                    } else if (t.identifier === aimTouchId) {
                        aimTouchId = null;
                    }
                }
            };
            _ourTouchEnd.__prScript = true;
            document.addEventListener('touchend', _ourTouchEnd, { passive: false, capture: true });

            document.addEventListener('touchcancel', () => {
                joystickTouchId = null; aimTouchId = null;
                mouse.down = false; mouse.buttons[0] = false;
                mouse.lock = false; stackRunning = false;
                stopMoving();
                relayJoystickToBots(0, false);
                events.mouseUp(0, mouse.x, mouse.y);
                if (bots.length) botsMsg({ type: 'mouseup', button: 0, x: mouse.x, y: mouse.y });
            }, { passive: false });

            const botIframes = document.createElement("div");
            Object.assign(botIframes.style, {
                position: "absolute", bottom: "20px", left: "200px", zIndex: "999999"
            });
            document.body.appendChild(botIframes);

            kbOverlay = document.createElement("div");
            kbOverlay.id = "kbOverlay";
            Object.assign(kbOverlay.style, {
                position: "fixed",
                bottom: "0",
                left: "0",
                width: "100%",
                zIndex: "9999995",
                background: "rgba(10,10,18,0.97)",
                backdropFilter: "blur(16px)",
                padding: "6px 3px 10px",
                boxSizing: "border-box",
                userSelect: "none",
                touchAction: "none",
                display: "none",
                flexDirection: "column",
                gap: "3px",
                borderTop: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 -8px 32px rgba(0,0,0,0.6)"
            });

            const KB_ROWS = [
                [
                    { l:'`',  c:'Backquote' }, { l:'1', c:'Digit1' }, { l:'2', c:'Digit2' },
                    { l:'3',  c:'Digit3'    }, { l:'4', c:'Digit4' }, { l:'5', c:'Digit5' },
                    { l:'6',  c:'Digit6'    }, { l:'7', c:'Digit7' }, { l:'8', c:'Digit8' },
                    { l:'9',  c:'Digit9'    }, { l:'0', c:'Digit0' }, { l:'⌫', c:'Backspace', w:1.6 }
                ],
                [
                    { l:'Tab', c:'Tab', w:1.6 },
                    { l:'Q', c:'KeyQ' }, { l:'W', c:'KeyW' }, { l:'E', c:'KeyE' },
                    { l:'R', c:'KeyR' }, { l:'T', c:'KeyT' }, { l:'Y', c:'KeyY' },
                    { l:'U', c:'KeyU' }, { l:'I', c:'KeyI' }, { l:'O', c:'KeyO' },
                    { l:'P', c:'KeyP' }, { l:'[', c:'BracketLeft' }, { l:']', c:'BracketRight' }
                ],
                [
                    { l:'A', c:'KeyA' }, { l:'S', c:'KeyS' }, { l:'D', c:'KeyD' },
                    { l:'F', c:'KeyF' }, { l:'G', c:'KeyG' }, { l:'H', c:'KeyH' },
                    { l:'J', c:'KeyJ' }, { l:'K', c:'KeyK' }, { l:'L', c:'KeyL' },
                    { l:';', c:'Semicolon' }, { l:"'", c:'Quote' },
                    { l:'Enter', c:'Enter', w:2.2, hi:'rgba(59,200,120,0.35)' }
                ],
                [
                    { l:'⇧', c:'ShiftLeft',  w:2.2, hi:'rgba(200,150,59,0.35)', tog:true },
                    { l:'Z', c:'KeyZ' }, { l:'X', c:'KeyX' }, { l:'C', c:'KeyC' },
                    { l:'V', c:'KeyV' }, { l:'B', c:'KeyB' }, { l:'N', c:'KeyN' },
                    { l:'M', c:'KeyM' }, { l:',', c:'Comma' }, { l:'.', c:'Period' },
                    { l:'/', c:'Slash' },
                    { l:'⇧', c:'ShiftRight', w:2.2, hi:'rgba(200,150,59,0.35)', tog:true }
                ],
                [
                    { l:'Esc',  c:'Escape',    w:1.5, hi:'rgba(239,68,68,0.35)' },
                    { l:'Ctrl', c:'ControlLeft',w:1.5, hi:'rgba(150,100,200,0.35)', tog:true },
                    { l:' Space ', c:'Space', w:5 },
                    { l:'←', c:'ArrowLeft'  }, { l:'↑', c:'ArrowUp'   },
                    { l:'↓', c:'ArrowDown'  }, { l:'→', c:'ArrowRight' }
                ]
            ];

            const kbTouchMap = new Map();
            const kbToggled  = new Set();

            function kbBtnAt(x, y) {
                for (const row of kbOverlay.children) {
                    for (const btn of row.children) {
                        if (!btn.__kbDef) continue;
                        const r = btn.getBoundingClientRect();
                        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return btn;
                    }
                }
                return null;
            }

            function kbPress(def, btn) {
                if (def.tog) {
                    if (kbToggled.has(def.c)) {
                        kbToggled.delete(def.c);
                        btn.style.background = "rgba(30,30,46,0.9)";
                        events.keyUp(def.c);
                        if (bots.length && getEl("botsReplKeys")?.checked) botsMsg({ type: "keyup", code: def.c });
                    } else {
                        kbToggled.add(def.c);
                        btn.style.background = def.hi || "rgba(59,130,246,0.8)";
                        events.keyDown(def.c);
                        if (bots.length && getEl("botsReplKeys")?.checked) botsMsg({ type: "keydown", code: def.c });
                    }
                    return false;
                }
                btn.style.background = def.hi || "rgba(59,130,246,0.8)";
                events.keyDown(def.c);
                if (bots.length && getEl("botsReplKeys")?.checked) botsMsg({ type: "keydown", code: def.c });
                return true;
            }

            function kbRelease(def, btn) {
                if (def.tog) return;
                btn.style.background = "rgba(30,30,46,0.9)";
                events.keyUp(def.c);
                if (bots.length && getEl("botsReplKeys")?.checked) botsMsg({ type: "keyup", code: def.c });
            }

            KB_ROWS.forEach(rowDef => {
                const rowEl = document.createElement("div");
                Object.assign(rowEl.style, {
                    display: "flex",
                    justifyContent: "center",
                    gap: "3px"
                });

                rowDef.forEach(def => {
                    const btn = document.createElement("button");
                    btn.__kbDef = def;
                    btn.textContent = def.l;
                    const baseW = 28;
                    const w = Math.round(baseW * (def.w || 1));
                    Object.assign(btn.style, {
                        width: w + "px",
                        height: "36px",
                        borderRadius: "8px",
                        background: kbToggled.has(def.c) ? (def.hi || "rgba(59,130,246,0.8)") : "rgba(30,30,46,0.9)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "white",
                        fontSize: def.w > 1.8 ? "11px" : "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        flexShrink: "0",
                        touchAction: "none",
                        transition: "background 0.08s",
                        padding: "0",
                        fontFamily: "'Inter','Segoe UI',system-ui"
                    });
                    rowEl.appendChild(btn);
                });

                kbOverlay.appendChild(rowEl);
            });

            document.body.appendChild(kbOverlay);

            kbOverlay.addEventListener("touchstart", (e) => {
                e.preventDefault();
                e.stopPropagation();
                for (const t of e.changedTouches) {
                    const btn = kbBtnAt(t.clientX, t.clientY);
                    if (!btn) continue;
                    const def = btn.__kbDef;
                    const registered = kbPress(def, btn);
                    if (registered) kbTouchMap.set(t.identifier, { def, btn });
                }
            }, { passive: false });

            kbOverlay.addEventListener("touchmove", (e) => {
                e.preventDefault();
                for (const t of e.changedTouches) {
                    const newBtn = kbBtnAt(t.clientX, t.clientY);
                    const old = kbTouchMap.get(t.identifier);
                    if (old && old.btn === newBtn) continue;
                    if (old) { kbRelease(old.def, old.btn); kbTouchMap.delete(t.identifier); }
                    if (newBtn && !newBtn.__kbDef.tog) {
                        const registered = kbPress(newBtn.__kbDef, newBtn);
                        if (registered) kbTouchMap.set(t.identifier, { def: newBtn.__kbDef, btn: newBtn });
                    }
                }
            }, { passive: false });

            function kbReleaseTouch(touches) {
                for (const t of touches) {
                    const old = kbTouchMap.get(t.identifier);
                    if (!old) continue;
                    kbRelease(old.def, old.btn);
                    kbTouchMap.delete(t.identifier);
                }
            }

            kbOverlay.addEventListener("touchend",    (e) => { e.preventDefault(); kbReleaseTouch(e.changedTouches); }, { passive: false });
            kbOverlay.addEventListener("touchcancel", (e) => { kbReleaseTouch(e.changedTouches); }, { passive: false });

            kbOverlay.addEventListener("mousedown", (e) => {
                const btn = kbBtnAt(e.clientX, e.clientY);
                if (btn) kbPress(btn.__kbDef, btn);
            });
            kbOverlay.addEventListener("mouseup", (e) => {
                kbOverlay.querySelectorAll("button").forEach(btn => {
                    if (btn.__kbDef && !btn.__kbDef.tog && !kbToggled.has(btn.__kbDef.c))
                        kbRelease(btn.__kbDef, btn);
                });
            });


            tankSelect     = getEl("tankSelect");
            botTankSelect  = getEl("botTankSelect");
            botMoving      = getEl("botsMoving");
            botMouseFollow = getEl("mouseFollowMode");
            fedingCheckbox = getEl("doFed");
            let XRayCheckbox   = getEl("xray");
            let seeEverything  = getEl("seeEverything");
            let XRayAlpha      = getEl("xrayAlpha");

            let dragOffX = 0, dragOffY = 0, dragging = false;
            const handle = getEl("dragHandle");
            handle.addEventListener("mousedown", e => {
                dragging = true;
                dragOffX = e.clientX - menu.offsetLeft;
                dragOffY = e.clientY - menu.offsetTop;
                e.preventDefault();
            });
            document.addEventListener("mousemove", e => {
                if (!dragging) return;
                menu.style.left = (e.clientX - dragOffX) + "px";
                menu.style.top  = (e.clientY - dragOffY) + "px";
            });
            document.addEventListener("mouseup", () => { dragging = false; });

            function saveJSON() {
                localStorage.setItem("pr_script_settings", JSON.stringify(stored));
            }

            var stored = localStorage.getItem("pr_script_settings");
            if (typeof stored != "string" || stored[0] != "{") {
                stored = { elements: {}, tab: "main", hideMenu: false };
                saveJSON();
            } else {
                stored = JSON.parse(stored);
            }

            window.changeMenu(stored.tab);

            for (const key in stored.elements) {
                if (!Object.hasOwn(stored.elements, key)) continue;
                const data = stored.elements[key];
                const element = getEl(key);
                if (!element) continue;
                if (data.type == "checkbox") element.checked = data.checked;
                else if (data.type == "select") element.value = data.value;
            }

            const bulletHiderThreshEl = getEl("bulletHiderThresh");
            const bulletHiderThreshValEl = getEl("bulletHiderThreshVal");
            if (bulletHiderThreshEl) {
                bulletHiderThreshEl.value = BULLET_RADIUS_THRESHOLD;
                if (bulletHiderThreshValEl) bulletHiderThreshValEl.textContent = BULLET_RADIUS_THRESHOLD;
                bulletHiderThreshEl.addEventListener("input", () => {
                    BULLET_RADIUS_THRESHOLD = parseFloat(bulletHiderThreshEl.value);
                    if (bulletHiderThreshValEl) bulletHiderThreshValEl.textContent = BULLET_RADIUS_THRESHOLD;
                    localStorage.setItem("arras_bullet_radius_threshold", BULLET_RADIUS_THRESHOLD);
                });
            }

            xrayEnabled = getEl("xray")?.checked || false;
            xrayAlphaVal = parseFloat(getEl("xrayAlpha")?.value) || 0.5;
            seeEverythingEnabled = getEl("seeEverything")?.checked || false;
            bulletHiderEnabled = getEl("bulletHider")?.checked || false;
            hideAssistMessages = getEl("hideAssistMsgs")?.checked || false;
            hideKillMessages = getEl("hideKillMsgs")?.checked || false;

            ["autoStats","autoRespawn","botsReplKeys","disRender","allowEZ","seeEverything","mouseFollowMode", "xray", "bulletHider", "hideAssistMsgs", "hideKillMsgs"].forEach(id => {
                const el = getEl(id);
                if (!el) return;
                el.addEventListener("click", () => {
                    stored.elements[id] = { type: "checkbox", checked: el.checked };
                    saveJSON();
                    if (id === "xray") xrayEnabled = el.checked;
                    if (id === "seeEverything") seeEverythingEnabled = el.checked;
                    if (id === "bulletHider") {
                        bulletHiderEnabled = el.checked;
                        _showNotif(`Bullet Hider ${el.checked ? 'ON' : 'OFF'}`, 'success');
                    }
                    if (id === "hideAssistMsgs") {
                        hideAssistMessages = el.checked;
                        localStorage.setItem(LS_HIDE_ASSIST, JSON.stringify(hideAssistMessages));
                        _showNotif(`Assist Messages ${el.checked ? 'HIDDEN' : 'SHOWN'}`, 'success');
                    }
                    if (id === "hideKillMsgs") {
                        hideKillMessages = el.checked;
                        localStorage.setItem(LS_HIDE_KILL, JSON.stringify(hideKillMessages));
                        _showNotif(`Kill Messages ${el.checked ? 'HIDDEN' : 'SHOWN'}`, 'success');
                    }
                });
            });

            if (XRayAlpha) {
                XRayAlpha.addEventListener("input", () => {
                    xrayAlphaVal = parseFloat(XRayAlpha.value) || 0.5;
                });
            }

            ["tankSelect","botTankSelect"].forEach(id => {
                const el = getEl(id);
                if (!el) return;
                el.addEventListener("change", () => {
                    if (id == "tankSelect") {
                        const desc = getEl("tankDesc");
                        if (desc) desc.innerHTML = tanks[tankSelect.value]?.desc || "";
                        getEl("soccerbotWrapper").hidden = tankSelect.value != "blockade";
                        if (tankSelect.value != "blockade") getEl("soccerbot").checked = false;
                        getEl("timekillerWrapper").hidden = tankSelect.value != "fighter";
                        if (tankSelect.value != "fighter") getEl("timekiller").checked = false;
                    }
                    stored.elements[id] = { type: "select", value: el.value };
                    saveJSON();
                });
            });

            botTankSelect.innerHTML = `<option value="none">None</option>`;
            for (let tank in tanks) {
                if (!Object.hasOwn(tanks, tank) || ["blockade","fastram","dreadV2"].includes(tank)) continue;
                tank = tanks[tank];
                botTankSelect.innerHTML += `<option value="${tank.id}">${tank.name || tank.id}</option>`;
            }
            botTankSelect.innerHTML += `
                <option disabled></option>
                <option disabled>Branches:</option>
                <option value="wiping">Tri-Angle</option>
                <option value="wipingAR">Tri-Angle (Arms Race)</option>
                <option value="necro">Underseer (Arms Race)</option>
                <option value="crash">Crashing (Arms Race)</option>
                <option value="feding">Feeding</option>
                <option value="fedingAR">Feeding (Arms Race)</option>`;

            const desc = getEl("tankDesc");
            if (desc) desc.innerHTML = tanks[tankSelect.value]?.desc || "";
            getEl("soccerbotWrapper").hidden = tankSelect.value != "blockade";
            getEl("timekillerWrapper").hidden = tankSelect.value != "fighter";

            let botFireDisabled = false;

            setInterval(() => {
                bots = bots.filter(bot => {
                    try { return !!bot.contentWindow.channel; } catch(e) { return false; }
                });
            }, 2000);

            botsMsg = function (msg) {
                if (!bots || !bots.length) return;
                if (botFireDisabled && msg.type === 'mousedown') return;
                for (const bot of bots) {
                    try { bot.contentWindow.channel.message(msg); } catch(e) {}
                }
            };

            getEl("botFireToggle").addEventListener("click", () => {
                botFireDisabled = !botFireDisabled;
                const btn = getEl("botFireToggle");
                if (botFireDisabled) {
                    btn.textContent = "Bot fire: OFF";
                    btn.style.background = "rgba(239,68,68,0.7)";
                    botsMsg({ type: 'mouseup', button: 0, x: mouse.x, y: mouse.y });
                } else {
                    btn.textContent = "Bot fire: ON";
                    btn.style.background = "rgba(59,130,246,0.7)";
                }
            });

            getEl("setSpawn").addEventListener("click", () => {
                if (!player.x) { alert("press L to let script know ur coordinates"); return; }
                chat(`$arena spawnpoint ${player.x} ${player.y}`);
            });

            getEl("botServerLink").addEventListener("input", () => {
                const raw = getEl("botServerLink").value.trim();
                const status = getEl("botServerLinkStatus");
                if (!raw) { status.textContent = ""; return; }
                try {
                    const url = new URL(raw);
                    if (url.hostname === "arras.io" || url.hostname === "localhost") {
                        status.textContent = " Valid link";
                        status.style.color = "#60a5fa";
                    } else {
                        status.textContent = " Not an arras.io link";
                        status.style.color = "#facc15";
                    }
                } catch {
                    status.textContent = " Invalid URL";
                    status.style.color = "#f87171";
                }
            });

            getEl("createBot").addEventListener("click", () => {
                const iframe = document.createElement("iframe");
                const linkInput = getEl("botServerLink").value.trim();
                let botSrc = location.href;
                if (linkInput) {
                    try { botSrc = new URL(linkInput).href; } catch {}
                }
                iframe.name = "__pr_is_bot";
                iframe.src = botSrc;
                iframe.width = 60;
                iframe.height = 40;

                const botWrapper = document.createElement('div');
                Object.assign(botWrapper.style, {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    margin: '2px',
                    textAlign: 'center',
                    position: 'relative'
                });

                const botLabel = document.createElement('div');
                const shortUrl = (() => {
                    try {
                        const u = new URL(botSrc);
                        const hash = u.hash.slice(1, 7) || '';
                        return hash ? u.hostname + ' #' + hash : u.hostname;
                    } catch { return botSrc.slice(0, 12); }
                })();
                botLabel.textContent = shortUrl;
                botLabel.title = botSrc;
                Object.assign(botLabel.style, {
                    fontSize: '8px',
                    color: 'rgba(255,255,255,0.7)',
                    background: 'rgba(0,0,0,0.55)',
                    borderRadius: '3px',
                    padding: '1px 3px',
                    marginBottom: '1px',
                    whiteSpace: 'nowrap'
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '';
                Object.assign(deleteBtn.style, {
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '16px',
                    height: '16px',
                    padding: '0',
                    border: 'none',
                    background: 'rgba(255,0,0,0.8)',
                    color: 'white',
                    fontSize: '10px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1',
                    fontWeight: 'bold'
                });
                deleteBtn.addEventListener('pointerdown', (e) => {
                    e.stopPropagation();
                    const idx = bots.indexOf(iframe);
                    if (idx > -1) bots.splice(idx, 1);
                    botWrapper.remove();
                });

                botWrapper.appendChild(botLabel);
                botWrapper.appendChild(deleteBtn);
                botWrapper.appendChild(iframe);
                botIframes.appendChild(botWrapper);
                bots.push(iframe);

                const labelInterval = setInterval(() => {
                    try {
                        const liveUrl = iframe.contentWindow.location.href;
                        botLabel.textContent = liveUrl;
                        botLabel.title = liveUrl;
                    } catch {
                        clearInterval(labelInterval);
                        botLabel.textContent = ' disconnected';
                    }
                }, 1000);
                const win = iframe.contentWindow;
                win.__is_bot = true;
                win.__bot_idx = bots.length - 1;
                win.channel = { message: () => {} };
                win.channel.clan = utils.removeBrackets(getEl("botClan").value);
                win.channel.unnamed = getEl("botUnnamed")?.checked || false;
                win.channel.disRender = getEl("disRender").checked;
                win.channel.tank = _lastMacroName ? "none" : (tanks[botTankSelect.value] || botTankSelect.value);
                win.channel.moving = botMoving ? botMoving.checked : true;
                win.channel.autofireE = getEl("botAutofireE")?.checked || false;
                win.channel.stackin = getEl("stackin")?.checked || false;
                win.channel.pendingMacro = _lastMacroName || null;
                win.channel.mouseAim = true;
            });

            getEl("spawnMultiple").addEventListener("click", () => {
                const count = parseInt(getEl("spawnCount").value, 10);
                if (isNaN(count) || count < 1) return;
                let n = 0;
                function spawnNext() {
                    if (n >= count) return;
                    getEl("createBot").click();
                    n++;
                    setTimeout(spawnNext, 150);
                }
                spawnNext();
            });

            getEl("reconnectBots").addEventListener("click", () => {
                for (const bot of bots) bot.contentWindow.channel.reconnect();
            });

            getEl("forceJoinBots").addEventListener("click", () => {
                for (const bot of bots) {
                    try {
                        bot.contentWindow.channel.message({ type: "keydown", code: "Enter" });
                        setTimeout(() => {
                            try { bot.contentWindow.channel.message({ type: "keyup", code: "Enter" }); } catch(e) {}
                        }, 80);
                    } catch(e) {}
                }
                _showNotif("Force Join sent to all bots", "success");
            });

            getEl("reloadBots").addEventListener("click", () => {
                for (const bot of bots) {
                    const savedClan   = utils.removeBrackets(getEl("botClan").value);
                    const savedTank   = tanks[botTankSelect.value] || botTankSelect.value;
                    const savedRender = getEl("disRender").checked;
                    bot.onload = () => {
                        const win = bot.contentWindow;
                        win.__is_bot = true;
                        win.channel = { message: () => {} };
                        win.channel.clan      = savedClan;
                        win.channel.disRender = savedRender;
                        win.channel.tank      = savedTank;
                        win.channel.moving    = botMoving.checked;
                        win.channel.unnamed   = getEl("botUnnamed")?.checked || false;
                        win.channel.pendingMacro = _lastMacroName || null;
                        bot.onload = null;
                    };
                    try { bot.contentWindow.location.reload(); } catch(e) { bot.src = bot.src; }
                }
            });

            getEl("dcBots").addEventListener("click", () => {
                bots = [];
                while (botIframes.firstChild) botIframes.removeChild(botIframes.firstChild);
            });

            getEl("botClan").addEventListener("input", () => {
                const tag = utils.removeBrackets(getEl("botClan").value.trim());
                for (const bot of bots) bot.contentWindow.channel.clan = tag;
            });
            getEl("botClanPreset").addEventListener("change", () => {
                const val = getEl("botClanPreset").value;
                if (!val) return;
                getEl("botClan").value = val;
                const tag = utils.removeBrackets(val);
                for (const bot of bots) bot.contentWindow.channel.clan = tag;
                getEl("botClanPreset").value = "";
            });
            getEl("botUnnamed").addEventListener("change", () => {
                const val = getEl("botUnnamed").checked;
                for (const bot of bots) bot.contentWindow.channel.unnamed = val;
            });

            getEl("mouseAimMode").addEventListener("change", () => {
                botsMsg({
                    type: "modeUpdate",
                    mouseAim:    getEl("mouseAimMode")?.checked,
                    mouseFollow: getEl("mouseFollowMode")?.checked,
                    followMe:    false
                });
            });

            getEl("mouseFollowMode").addEventListener("change", () => {
                botsMsg({
                    type: "modeUpdate",
                    mouseAim:    getEl("mouseAimMode")?.checked,
                    mouseFollow: getEl("mouseFollowMode")?.checked,
                    followMe:    false
                });
            });

            getEl("botTankSelect").addEventListener("change", () => {
                for (const bot of bots)
                    bot.contentWindow.channel.tank = tanks[botTankSelect.value] || botTankSelect.value;
            });

            getEl("botsMoving").addEventListener("change", () => {
                for (const bot of bots) bot.contentWindow.channel.moving = botMoving.checked;
            });

            getEl("botAutofireE").addEventListener("change", () => {
                const val = getEl("botAutofireE").checked;
                for (const bot of bots) bot.contentWindow.channel.autofireE = val;
            });

            //  PATCHED: Go to coords now ALSO aims and fires 
            getEl("botGotoBtn").addEventListener("click", () => {
                const x = parseFloat(getEl("botGotoX").value);
                const y = parseFloat(getEl("botGotoY").value);
                const fire = getEl("botGotoFire")?.checked ?? true;
                botsMsg({ type: "gotoCoords", x, y, fire });
                botsMsg({ type: "aimUpdate", aimX: x, aimY: y });
                botsMsg({ type: "modeUpdate", mouseAim: true, mouseFollow: false, followMe: false });
                _showNotif(`Bots: goto (${x.toFixed(0)}, ${y.toFixed(0)}) + aim${fire ? " + fire" : ""}`, 'success');
            });

            getEl("botGotoStop").addEventListener("click", () => {
                botsMsg({ type: "gotoCoords", x: null, y: null });
                botsMsg({ type: "mouseup", button: 0, x: 0, y: 0 });
                botsMsg({ type: "modeUpdate",
                    mouseAim:    getEl("mouseAimMode")?.checked,
                    mouseFollow: getEl("mouseFollowMode")?.checked,
                    followMe:    false });
                _showNotif('Bots: goto stopped', 'success');
            });
            // 

            getEl("stackin").addEventListener("change", () => {
                const val = getEl("stackin").checked;
                for (const bot of bots) bot.contentWindow.channel.stackin = val;
            });

            let _chatSpamTimer = null;
            function _scheduleChatSpam() {
                if (_chatSpamTimer) clearTimeout(_chatSpamTimer);
                if (!getEl("botChatSpam")?.checked || !bots.length) {
                    _chatSpamTimer = setTimeout(_scheduleChatSpam, 1000);
                    return;
                }
                const msg = getEl("botChatMsg")?.value.trim();
                if (msg) {
                    bots.forEach((bot, i) => {
                        setTimeout(() => {
                            try { bot.contentWindow.channel.message({ type: "chat", msg }); } catch(e) {}
                        }, i * 1500);
                    });
                }
                _chatSpamTimer = setTimeout(_scheduleChatSpam, Math.max(3000, bots.length * 1500));
            }
            _scheduleChatSpam();

            fedingCheckbox.addEventListener("change", () => {
                for (const bot of bots) bot.contentWindow.channel.feeed(fedingCheckbox.checked);
            });

            window.fedPath = [];
            getEl("addFedLocation").addEventListener("click", () => {
                const perf = () => {
                    window.fedPath.push({ x: player.x, y: player.y });
                    for (const bot of bots) {
                        try { bot.contentWindow.fedPath?.push({ x: player.x, y: player.y }); } catch(e) {}
                    }
                };
                if (player.x && player.y) perf();
                else { events.press("KeyL"); setTimeout(perf, 100); }
            });

            getEl("resetFedPath").addEventListener("click", () => {
                window.fedPath = [];
                currentFedPath = [];
                for (const bot of bots) bot.contentWindow.channel.feeedRESET();
            });

            getEl("pibuild").addEventListener("click", () => {
                upgradeStats(Math.PI.toString().replace(".","").split("").slice(0,10).join("/"));
            });

            getEl("extraUpgradeBtn").addEventListener("click", () => {
                const tank = tanks[getEl("extraTankSelect").value];
                if (!tank) return;
                upgradeTank(tank.path);
                upgradeStats(tank);
            });

            getEl("resetAuthBtn").addEventListener("click", () => {
                clearAuth();
                alert("Authorization cleared. Please refresh the page to re-enter key.");
                location.reload();
            });

            const _prRespawnSel = getEl("pr_respawn_build_sel");
            const _prRespawnBtn = getEl("pr_force_respawn_btn");
            if (_prRespawnSel) {
                _prRespawnSel.value = _selectedRespawnBuild;
                _prRespawnSel.addEventListener('change', () => {
                    _selectedRespawnBuild = _prRespawnSel.value;
                    localStorage.setItem(LS_RESPAWN_BUILD, _selectedRespawnBuild);
                });
            }
            if (_prRespawnBtn) {
                _prRespawnBtn.addEventListener('click', () => {
                    events.press("Enter");
                    if (_selectedRespawnBuild !== 'none') setTimeout(() => _executeBuild(_selectedRespawnBuild), 600);
                    localStorage.setItem(LS_FORCE_RESPAWN_MB, JSON.stringify({ timestamp: Date.now(), build: _selectedRespawnBuild }));
                    for (const bot of bots) {
                        try {
                            bot.contentWindow.channel.message({ type: 'keydown', code: 'Enter' });
                            setTimeout(() => {
                                try { bot.contentWindow.channel.message({ type: 'keyup', code: 'Enter' }); } catch(e){}
                            }, 80);
                        } catch(e) {}
                    }
                    _showNotif(`Respawn signal sent (${_selectedRespawnBuild})`, 'success');
                });
            }

            const _prFormEn  = getEl("pr_formation_enabled");
            const _prFormType = getEl("pr_formation_type");
            const _prFormSpc  = getEl("pr_formation_spacing");
            const _prFormSpcV = getEl("pr_formation_spacing_val");
            if (_prFormEn) {
                _prFormEn.checked = formationConfig.enabled;
                _prFormEn.addEventListener('change', () => {
                    formationConfig.enabled = _prFormEn.checked;
                    localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
                    _showNotif(`Formation ${formationConfig.enabled ? 'ON' : 'OFF'}`, 'success');
                });
            }
            if (_prFormType) {
                _prFormType.value = formationConfig.type;
                _prFormType.addEventListener('change', () => {
                    formationConfig.type = _prFormType.value;
                    localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
                });
            }
            if (_prFormSpc) {
                _prFormSpc.value = formationConfig.spacing;
                if (_prFormSpcV) _prFormSpcV.textContent = formationConfig.spacing;
                _prFormSpc.addEventListener('input', () => {
                    formationConfig.spacing = parseInt(_prFormSpc.value);
                    if (_prFormSpcV) _prFormSpcV.textContent = formationConfig.spacing;
                    localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
                });
            }
            // Wire up +/- buttons for sliders
document.querySelectorAll('.slider-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const delta = parseInt(btn.dataset.delta);
        const slider = document.getElementById(targetId);
        if (!slider) return;
        const newVal = Math.max(
            parseInt(slider.min),
            Math.min(parseInt(slider.max), parseInt(slider.value) + delta)
        );
        slider.value = newVal;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
});
            const _prFollowDist  = getEl("pr_follow_dist");
            const _prFollowDistV = getEl("pr_follow_dist_val");
            if (_prFollowDist) {
                _prFollowDist.value = _followDistance;
                if (_prFollowDistV) _prFollowDistV.textContent = _followDistance;
                _prFollowDist.addEventListener('input', () => {
                    _followDistance = parseInt(_prFollowDist.value);
                    if (_prFollowDistV) _prFollowDistV.textContent = _followDistance;
                    localStorage.setItem(LS_FOLLOW_DIST_PR, _followDistance.toString());
                });
            }

            const _prClearKills = getEl("pr_clear_kills");
            if (_prClearKills) {
                _prClearKills.addEventListener('click', () => { killLog = []; _updateKillLog(); _showNotif('Kill log cleared', 'success'); });
            }
            _updateKillLog();

            const _prAutoUser = getEl("pr_auto_username");
            const _prUserTheme = getEl("pr_username_theme");
            const _prSetUserNow = getEl("pr_set_username_now");
            if (_prAutoUser) {
                _prAutoUser.checked = autoUsernameEnabled;
                _prAutoUser.addEventListener('change', () => {
                    autoUsernameEnabled = _prAutoUser.checked;
                    localStorage.setItem(LS_AUTO_USERNAME, JSON.stringify(autoUsernameEnabled));
                    _showNotif(`Auto Username ${autoUsernameEnabled ? 'ON' : 'OFF'}`, 'success');
                });
            }
            if (_prUserTheme) {
                _prUserTheme.value = usernameTheme;
                _prUserTheme.addEventListener('change', () => {
                    usernameTheme = _prUserTheme.value;
                    localStorage.setItem('arras_username_theme', usernameTheme);
                });
            }
            if (_prSetUserNow) {
                _prSetUserNow.addEventListener('click', () => {
                    const input = document.querySelector("body > input[type=text]");
                    if (input) {
                        const name = getRandomUsername();
                        input.value = name;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        _showNotif(`Username set: ${name}`, 'success');
                    } else {
                        _showNotif('No name input found (spawn screen?)', 'error');
                    }
                });
            }

            const _prPreciseAim = getEl("pr_precise_aim");
            if (_prPreciseAim) {
                _prPreciseAim.checked = _preciseAim;
                _prPreciseAim.addEventListener('change', () => {
                    _preciseAim = _prPreciseAim.checked;
                    localStorage.setItem(LS_PRECISE_AIM_PR, JSON.stringify(_preciseAim));
                    _showNotif(`Precise Aim ${_preciseAim ? 'ON' : 'OFF'}`, 'success');
                });
            }

            const _prChat1 = getEl("pr_chat_msg1");
            const _prChat2 = getEl("pr_chat_msg2");
            const _prSendChat = getEl("pr_send_chat_now");
            if (_prChat1) {
                _prChat1.value = chatMessage1;
                _prChat1.addEventListener('input', () => {
                    chatMessage1 = _prChat1.value;
                    localStorage.setItem('arras_chat_msg_1', chatMessage1);
                });
            }
            if (_prChat2) {
                _prChat2.value = chatMessage2;
                _prChat2.addEventListener('input', () => {
                    chatMessage2 = _prChat2.value;
                    localStorage.setItem('arras_chat_msg_2', chatMessage2);
                });
            }
            if (_prSendChat) {
                _prSendChat.addEventListener('click', () => {
                    chat(chatMessage1);
                    setTimeout(() => chat(chatMessage2), 1500);
                    _showNotif('Chat messages sent!', 'success');
                });
            }

            const _prFpsEn  = getEl("pr_fps_enabled");
            const _prFpsLim = getEl("pr_fps_limit");
            const _prFpsVal = getEl("pr_fps_val");
            if (_prFpsEn) {
                _prFpsEn.checked = _followerFpsEnabled;
                _prFpsEn.addEventListener('change', () => {
                    _followerFpsEnabled = _prFpsEn.checked;
                    if (_followerFpsEnabled) botsMsg({ type: 'enableFps', limit: _fpsLimit });
                    else botsMsg({ type: 'disableFps' });
                    _showNotif(`FPS Limiter ${_followerFpsEnabled ? 'ON ('+_fpsLimit+' FPS)' : 'OFF'}`, 'success');
                });
            }
            if (_prFpsLim) {
                _prFpsLim.value = _fpsLimit;
                if (_prFpsVal) _prFpsVal.textContent = _fpsLimit;
                _prFpsLim.addEventListener('input', () => {
                    _fpsLimit = parseInt(_prFpsLim.value);
                    if (_prFpsVal) _prFpsVal.textContent = _fpsLimit;
                    if (_followerFpsEnabled) botsMsg({ type: 'enableFps', limit: _fpsLimit });
                });
            }

            {
                const savedT = localStorage.getItem('arras_username_theme');
                if (savedT) usernameTheme = savedT;
                const savedAU = localStorage.getItem(LS_AUTO_USERNAME);
                if (savedAU !== null && JSON.parse(savedAU)) {
                    const _auInterval = setInterval(() => {
                        const inp = document.querySelector("body > input[type=text]");
                        if (!inp) return;
                        clearInterval(_auInterval);
                        if (autoUsernameEnabled) {
                            inp.value = getRandomUsername();
                            inp.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }, 77);
                }
            }

            var mem;
            getEl("test_wasm")?.addEventListener("click", () => {
                if (!mem) { mem = HEAPU32; return; }
                let out = new Uint32Array();
                for (let i = 0; i < HEAPU32.length; i++) {
                    const elk1 = mem[i], elk2 = HEAPU32[i];
                    if (getEl("wasmcringe")?.checked) { if (elk1 == elk2) out[out.length] = elk1; }
                    else { if (elk1 != elk2) out[out.length] = elk2; }
                }
                mem = out;
            });

            let sbCycle = false;
            setInterval(() => {
                if (getEl("soccerbot")?.checked) {
                    events._keyEvent("KeyW", sbCycle);
                    events._keyEvent("KeyS", !sbCycle);
                    sbCycle = !sbCycle;
                }
            }, 5500);

            setInterval(() => {
                if (getEl("timekiller")?.checked) {
                    stopMoving();
                    dirPathfind(mouse.dir + Math.PI);
                    setTimeout(() => { stopMoving(); dirPathfind(mouse.dir); }, 800);
                }
            }, 2000);
        }

        const nameInterval = setInterval(() => {
            const input = document.querySelector("body > input[type=text]");
            if (!input) return;
            clearInterval(nameInterval);
            player.name = input.value;
            if (window.__is_bot) {
                if (channel.unnamed) {
                    input.value = "";
                } else {
                    const names = ["Aaron","Abigail","Addison","Adeline","Adrian","Aiden","Aaliyah","Alexander","Alice","Allison","Amelia","Andrew","Angel","Anthony","Aria","Asher","Athena","Austin","Aurora","Ava","Avery","Ayden","Benjamin","Bentley","Blake","Brandon","Brayden","Caleb","Camila","Cameron","Caroline","Carter","Charles","Chase","Charlotte","Chloe","Christian","Christopher","Claire","Clara","Cole","Colton","Connor","Cooper","Daisy","Daniel","David","Delilah","Declan","Dylan","Easton","Eden","Eleanor","Elena","Eliana","Elias","Elijah","Ella","Ellie","Emery","Emilia","Emily","Emma","Ethan","Evelyn","Everly","Ezra","Gabriel","Gavin","Genesis","Gianna","Grace","Hailey","Hannah","Harper","Hazel","Henry","Hudson","Hunter","Isaac","Isabella","Isla","Isaiah","Iris","Ivy","Jack","Jace","Jade","James","Jason","Jaxon","Jayden","Jeremiah","John","Jordan","Joseph","Josephine","Josiah","Josie","Joshua","Julian","Landon","Layla","Leah","Leilani","Leo","Liam","Lillian","Lily","Lincoln","Logan","Lucy","Luna","Luke","Madeline","Madison","Maeve","Maria","Mason","Mateo","Matthew","Maya","Michael","Mia","Mila","Millie","Naomi","Nicholas","Nolan","Nora","Nova","Oliver","Olivia","Owen","Paisley","Parker","Penelope","Quinn","Riley","Ruby","Ryan","Sadie","Samantha","Samuel","Sarah","Savannah","Scarlett","Sebastian","Sofia","Sophia","Stella","Theodore","Thomas","Victoria","Violet","Waylon","Willow","William","Wyatt","Xavier","Zoe","Zoey"];
                    let name = names[Math.floor(Math.random() * names.length)];
                    if (channel.clan) name = `[${channel.clan}] ${name}`;
                    input.value = name;
                }
            } else if (autoUsernameEnabled) {
                const name = getRandomUsername();
                input.value = name;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, 77);
    }

    if (document.body) {
        initUI();
    } else {
        document.addEventListener("DOMContentLoaded", initUI);
    }

    if (window.__is_bot) {
        if (window.channel.disRender) {
            WebGLRenderingContext.prototype.drawElements = () => {};
            WebGLRenderingContext.prototype.drawArrays   = () => {};
            WebGLRenderingContext.prototype.clear        = () => {};
            WebGLRenderingContext.prototype.viewport     = () => {};
            CanvasRenderingContext2D.prototype.fill       = () => {};
            CanvasRenderingContext2D.prototype.fillRect   = () => {};
            CanvasRenderingContext2D.prototype.stroke     = () => {};
            CanvasRenderingContext2D.prototype.strokeRect = () => {};
            CanvasRenderingContext2D.prototype.roundRect  = () => {};
            CanvasRenderingContext2D.prototype.lineTo     = () => {};
            CanvasRenderingContext2D.prototype.arc        = () => {};
            CanvasRenderingContext2D.prototype.drawImage  = () => {};
            window.requestAnimationFrame = (cb) => setTimeout(cb, 500);
        }

        const _channelFiredKeys = new Set();

        setInterval(() => {
            try {
                const raw = localStorage.getItem(LS_KEYS);
                if (raw) {
                    const { keyStates } = JSON.parse(raw);
                    replicatableKeys.forEach(k => {
                        const target = keyStates[k] === true;
                        if (lastReceivedKeyStates[k] !== target) {
                            lastReceivedKeyStates[k] = target;
                            if (_channelFiredKeys.has(k)) { _channelFiredKeys.delete(k); return; }
                            if (target) events.keyDown(k);
                            else events.keyUp(k);
                        }
                    });
                }
            } catch(e) {}

            try {
                if (window.channel.mouseAim && sinsay.aimX !== undefined && player.x !== undefined) {
                    let screenX = ((sinsay.aimX - player.x) / globalFov * (inner.width / 2)) + (inner.width / 2);
                    let screenY = ((sinsay.aimY - player.y) / (globalFov * (inner.height / inner.width)) * (inner.height / 2)) + (inner.height / 2);
                    screenX = Math.max(10, Math.min(inner.width - 10, screenX));
                    screenY = Math.max(10, Math.min(inner.height - 10, screenY));
                    events.moveTo(screenX, screenY);
                }
            } catch(e) {}
        }, 16);

        const oldSetItem = localStorage.setItem;
        localStorage.setItem = function (key, value) {
            if (key == "arras.io") return;
            oldSetItem.call(this, key, value);
        };

        const inner = { width: innerWidth, height: innerHeight };

        window.channel.feeed      = bool => { if (fedingCheckbox) fedingCheckbox.checked = bool; };
        window.channel.feeedRESET = () => { window.fedPath = []; currentFedPath = []; };

        let _pendingChat = null;
        const _origAppend = Node.prototype.nappend;
        const _hookedAppend = Node.prototype.appendChild;
        Node.prototype.appendChild = function(node) {
            const result = _hookedAppend.call(this, node);
            if (node.tagName === "INPUT" && node.type === "text" && _pendingChat) {
                const msg = _pendingChat;
                _pendingChat = null;
                setTimeout(() => {
                    node.value = msg;
                    node.dispatchEvent(new Event("input", { bubbles: true }));
                    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
                    node.dispatchEvent(new KeyboardEvent("keyup",   { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
                    setTimeout(() => { _chatInFlight = false; }, 600);
                }, 20);
            }
            return result;
        };
        window._setPendingChat = (msg) => {
            _pendingChat = msg;
            events.press("Enter");
        };

        let _chatInFlight = false;
        const interval2 = setInterval(() => {
            if (isConnecting) { events.press("KeyL"); clearInterval(interval2); return; }
            if (spawned) { clearInterval(interval2); return; }
            if (_chatInFlight) return;
            events.press("Enter");
        }, 200);

        window.channel.message = function (msg) {
            if (msg.type == "mousedown") {
                events.mouseDown(msg.button, msg.x, msg.y);
            } else if (msg.type == "mouseup") {
                events.mouseUp(msg.button, msg.x, msg.y);
            } else if (msg.type == "modeUpdate") {
                window.channel.mouseAim    = msg.mouseAim;
                window.channel.mouseFollow = msg.mouseFollow;
                window.channel.followMe    = msg.followMe;
            } else if (msg.type == "aimUpdate") {
                sinsay.aimX = msg.aimX;
                sinsay.aimY = msg.aimY;
            } else if (msg.type == "mousemove") {
                if (msg.worldX !== undefined) {
                    sinsay.worldX = msg.worldX;
                    sinsay.worldY = msg.worldY;
                }
            } else if (msg.type == "cursormirror") {
                const cx = msg.nx * innerWidth;
                const cy = msg.ny * innerHeight;
                events.moveTo(cx, cy);
            } else if (msg.type == "keydown" && msg.code != "KeyL") {
                if (typeof _channelFiredKeys !== 'undefined') _channelFiredKeys.add(msg.code);
                events.keyDown(msg.code);
            } else if (msg.type == "keyup" && msg.code != "KeyL") {
                if (typeof _channelFiredKeys !== 'undefined') _channelFiredKeys.add(msg.code);
                events.keyUp(msg.code);
            } else if (msg.type == "position") {
                sinsay.x = msg.x;
                sinsay.y = msg.y;
                if (msg.minDist !== undefined) sinsay.minDist = msg.minDist;
            } else if (msg.type == "chat") {
                if (_chatInFlight) return;
                _chatInFlight = true;
                const inp = document.querySelector("body > input[type=text]");
                if (inp) {
                    inp.value = msg.msg;
                    inp.dispatchEvent(new Event("input", { bubbles: true }));
                    inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
                    inp.dispatchEvent(new KeyboardEvent("keyup",   { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
                    setTimeout(() => { _chatInFlight = false; }, 600);
                } else {
                    _pendingChat = msg.msg;
                    events.press("Enter");
                }
            } else if (msg.type == "enableFps") {
                _enableFpsLimiter(msg.limit);
            } else if (msg.type == "disableFps") {
                _disableFpsLimiter();
            } else if (msg.type == "upgrade") {
                performMacroUpgrade(msg.macro);
            } else if (msg.type == "gotoCoords") {
                //  PATCHED: gotoCoords now also aims + fires 
                if (msg.x === null) {
                    sinsay._gotoTarget = null;
                    sinsay.aimX = undefined;
                    sinsay.aimY = undefined;
                    window.channel._gotoFire = false;
                    events.mouseUp(0, innerWidth/2, innerHeight/2);
                } else {
                    sinsay._gotoTarget = { x: msg.x, y: msg.y };
                    sinsay.aimX = msg.x;
                    sinsay.aimY = msg.y;
                    window.channel.mouseAim = true;
                    if (msg.fire) {
                        window.channel._gotoFire = true;
                        setTimeout(() => {
                            if (window.channel._gotoFire) {
                                events.mouseDown(0, innerWidth/2, innerHeight/2);
                            }
                        }, 300);
                    }
                }
                // 
            }
        };

        window.channel.reconnect = () => {
            setTimeout(() => events.click(0, 32, 26), 50);
        };

        window.addEventListener("keydown", function (e) {
            if (e.key === "Tab" || e.key === "Escape") {
                const m = document.getElementById("scriptMenu");
                if (m) m.style.display = m.style.display === "flex" ? "none" : "flex";
            }
        }, true);
    }


    // ============= TEAM COLOR DETECTION =============
    let _lastSentTeamColor = null;
    function detectAndSendTeamColor() {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        if (!w || !h) return;

        // Sample a grid around the player (center screen)
        const sampleW = 100, sampleH = 100;
        const sx = Math.max(0, Math.floor(w/2 - sampleW/2));
        const sy = Math.max(0, Math.floor(h/2 - sampleH/2));
        try {
            const imageData = ctx.getImageData(sx, sy, sampleW, sampleH).data;
            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < imageData.length; i += 20) {
                const pxR = imageData[i], pxG = imageData[i+1], pxB = imageData[i+2];
                // Skip gray/white/black (UI elements, background)
                const max = Math.max(pxR, pxG, pxB), min = Math.min(pxR, pxG, pxB);
                if (max - min < 30) continue; // too gray
                if (max < 60) continue; // too dark
                r += pxR; g += pxG; b += pxB; count++;
            }
            if (count < 10) return;
            r /= count; g /= count; b /= count;

            // HSV hue
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let hue = 0;
            if (max !== min) {
                const d = max - min;
                if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                else if (max === g) hue = ((b - r) / d + 2) / 6;
                else hue = ((r - g) / d + 4) / 6;
            }
            hue *= 360;

            let team = null;
            if (hue >= 70 && hue <= 170) team = "green";
            else if (hue >= 175 && hue <= 265) team = "blue";
            else if ((hue >= 270 && hue <= 360) || (hue >= 0 && hue <= 45)) team = "pink";

            if (team && team !== _lastSentTeamColor) {
                _lastSentTeamColor = team;
                // Send to all ext bot servers
                connections.forEach(c => {
                    if (c.verified && c.ws && c.ws.readyState === WebSocket.OPEN) {
                        try { c.ws.send(msgpack.encode(["H", team])); } catch(e) {}
                    }
                });
                // team color log silenced for high bot count
            }
        } catch(e) {}
    }
    setInterval(detectAndSendTeamColor, 2500);
    // ============= EXT BOTS (Codespace WebSocket) =============
    (function() {
        // Use native WebSocket (before PR script override)
        const NativeWebSocket = window.WebSocket;
        // Verify msgpack is available
        if (typeof msgpack === "undefined" || !msgpack.encode || !msgpack.decode) {
            console.error("[ext bots] msgpack-lite library not loaded! ext bots disabled.");
            return;
        }
        let extPlayerX = 0, extPlayerY = 0;
        let extMouseX = 0, extMouseY = 0;
        let extMouseDown = false, extRMouseDown = false;
        let extGameFOV = 45.8;
        function extChat(msg, spam) {
    connections.forEach((conn, i) => {
        if (!conn.verified) return;
        extPacketTo(conn, "T", msg, spam);
    });
}

const SERVERS = [
    { name: "Server 1", url: "" },
    { name: "Server 2", url: "" },
    { name: "Server 3", url: "" },
    { name: "Server 4", url: "" },
    { name: "Server 5", url: "" },
    { name: "Server 6", url: "" },
    { name: "Server 7", url: "" },
    { name: "Server 8", url: "" },
];

// Load custom servers from localStorage
let customServers = [];
try {
    const raw = localStorage.getItem('pr_ext_custom_servers');
    if (raw) customServers = JSON.parse(raw);
} catch(e) {}

function getAllServers() {
    return [...SERVERS, ...customServers];
}

function addCustomServer(name, url) {
    let fixedUrl = url.trim();

    // Strip protocol
    if (fixedUrl.startsWith('https://')) fixedUrl = fixedUrl.slice(8);
    else if (fixedUrl.startsWith('http://')) fixedUrl = fixedUrl.slice(7);
    else if (fixedUrl.startsWith('wss://')) fixedUrl = fixedUrl.slice(6);
    else if (fixedUrl.startsWith('ws://')) fixedUrl = fixedUrl.slice(5);

    // GitHub Codespace format: name.github.dev -> name-8082.app.github.dev
    if (fixedUrl.endsWith('.github.dev/')) {
        fixedUrl = fixedUrl.slice(0, -12); // remove .github.dev/
        if (!fixedUrl.includes('-8082.app')) fixedUrl += '-8082.app';
        fixedUrl += '.github.dev/';
    } else if (fixedUrl.endsWith('.github.dev')) {
        fixedUrl = fixedUrl.slice(0, -11); // remove .github.dev
        if (!fixedUrl.includes('-8082.app')) fixedUrl += '-8082.app';
        fixedUrl += '.github.dev/';
    }

    // Ensure wss:// prefix
    fixedUrl = 'wss://' + fixedUrl;

    // Ensure trailing slash
    if (!fixedUrl.endsWith('/')) fixedUrl += '/';

    customServers.push({ name: name || `Custom ${customServers.length + 1}`, url: fixedUrl });
    localStorage.setItem('pr_ext_custom_servers', JSON.stringify(customServers));
    return fixedUrl;
}

function removeCustomServer(index) {
    customServers.splice(index, 1);
    localStorage.setItem('pr_ext_custom_servers', JSON.stringify(customServers));
}
                let currentTank = "basic";

        const tankCategories = {
            "Quick": {
                crash: { name: "Crash (AR)", tanks: ["whirlwind","tempest","septamech","doubleequalizer","rigger","lorry","manufacture","doublespread","palisade"] },
                spike: "Spike",
                megaspike: "Mega Spike",
                booster: "Booster",
                fighter: "Fighter",
                anni: "Annihilator",
                factory: "Factory",
                overseer: "Overseer"
            },
            "Essentials": {
                basic: "Basic", twin: "Twin", sniper: "Sniper", machinegun: "Machine Gun",
                flankguard: "Flank Guard", director: "Director", pounder: "Pounder",
                megasmasher: "Smasher", auto6: "Auto-4/6", mega3: "Mega-3",
                shotgun: "Shotgun", pursuer: "Pursuer", wrench: "Wrench", random: "Feed (Random)"
            },
            "Advanced Tanks": {
                doubletwin: "Double Twin", tripleshot: "Triple Shot", sprayer: "Sprayer",
                redistributor: "Redistributor", hexatank: "Hexa Tank", octotank: "Octo Tank",
                booster: "Booster", fighter: "Fighter", tripletwin: "Triple Twin",
                overseer: "Overseer", underseer: "Underseer", manager: "Manager",
                destroyer: "Destroyer", anni: "Annihilator", rocketeer: "Rocketeer",
                gunner: "Gunner", nailgun: "Nailgun", pincer: "Pincer", auto3: "Auto-3",
                auto4: "Auto-4", toppler: "Toppler", crack: "Crackshot", triplex: "Triplex",
                quadruplex: "Quadruplex", predator: "Predator", lorry: "Lorry", parapet: "Parapet"
            },
            "Traps": {
                septatrap: "Septa Trap", hexatrapper: "Hexa Trapper", trapguard: "Trap Guard",
                gunnertrapper: "Gunner Trapper", tritrapper: "Tri-Trapper", fortress: "Fortress",
                septatrapper: "Septa Trapper", buchwhacker: "Bushwhacker", conqueror: "Conqueror",
                bulwark: "Bulwark"
            },
            "Arms Race / Special": {
                browser: "Browser", strider: "Strider", surfer: "Surfer", eagle: "Eagle",
                phoenix: "Phoenix", vulture: "Vulture", automingler: "Automingler",
                mingler: "Mingler", gale: "Gale", nona: "Nona", septamachine: "Septa Machine",
                jerker: "Jerker", lever: "Lever", hognose: "Hognose", limpet: "Limpet",
                firework: "Firework", coli: "Collision", levi: "Leviathan", cyclone: "Cyclone",
                spinner: "Spinner", helix_ar: "Helix", hyperswarmer: "Hyperswarmer",
                neutron: "Neutron", triangle: "Tri-Angle", falcon: "Falcon", banshee: "Banshee",
                assassin: "Assassin", stalker: "Stalker", launcher: "Launcher", cruiser: "Cruiser",
                directordrive: "Director Drive", honcho: "Honcho", shopper: "Shopper",
                megaspawner: "Mega Spawner", ultraspawner: "Ultra Spawner",
                autofighter: "Auto Fighter", griffin: "Griffin", rocket: "Rocket (ram)"
            },
            "Support & Utility": {
                engineer: "Engineer", assembler: "Assembler", architect: "Architect",
                factory: "Factory", spawner: "Spawner", foundry: "Foundry",
                topbanana: "Top Banana", healer: "Healer", physician: "Physician", chemist: "Chemist"
            },
            "Smashers & Rams": {
                megasmasher: "Mega Smasher", spike: "Spike", autoshasher: "Auto Smasher",
                landmine: "Landmine", thorn: "Thorn", megaspike: "Mega Spike",
                claymore: "Claymore", spear: "Spear", prick: "Prick", slammer: "Slammer",
                basher: "Basher"
            },
            "Branches": {
                triangle_path: { name: "Tri-Angle Path", tanks: ["fighter","autotriangle","surfer","bomber","phoenix"] },
                launchers: { name: "Launchers Path", tanks: ["skimmer","twister","swarmer","sidewinder","fieldgun"] },
                drones: { name: "Drones Path", tanks: ["overczar","tyrant","autooverlord","megaautooverseer","tripleautooverseer","autooverdrive","headman","overcheese","overstorm"] },
                auto3_path: { name: "Auto-3 Path", tanks: ["auto5","mega3","auto6"] },
                dps: { name: "DPS Path", tanks: ["penta","spread","octo","autogunner","triplet","predator","triplex","quadruplex","machinegunner"] },
                smashers_branch: { name: "Smashers Path", tanks: ["megasmasher","spike","autoshasher","landmine"] },
                traps_branch: { name: "Traps Path", tanks: ["hexatrapper","tritrapper","fortress","septatrapper","gunnertrapper","septatrap"] }
            },
            "Arms Race Branches": {
                triangle_ar: { name: "Tri-Angle (AR)", tanks: ["browser","strider","autobomber","tripleautotriangle","surferdrive","electrocutor","kicker","megaautotriangle","roller","autoeagle"] },
                launchers_ar: { name: "Launchers (AR)", tanks: ["hyperskimmer","skidder","gyro","hypercluster","coli","molotov","hypertwister","ream"] },
                annies: { name: "Annihilators (AR)", tanks: ["obliterator","compound","wiper","stomper","autoanni","shaver","eradicator"] },
                necro: { name: "Underseer (AR)", tanks: ["diviner","autonecro","necrodrive","megaautounderdrive","tripleautounderdrive","pentamancer","pentadrive","warlock","autopentaseer"] },
                carriers: { name: "Carriers (AR)", tanks: ["warship","battlerdrive","bismarck","proddrive","manufacture","dirigible","autobattleship","autoprod","autocruiserdrive"] },
                auto3_ar: { name: "Auto-3 (AR)", tanks: ["auto6","auto7","mega5","batter4","hurler3","autoauto4"] },
                dps_ar: { name: "DPS (AR)", tanks: ["toppler","coli","crack","autooperator","manufacture","lorry"] },
                spikes_ar: { name: "Spikes (AR)", tanks: ["thorn","megaspike","claymore","spear","prick"] },
                crash: { name: "Crash (AR)", tanks: ["whirlwind","tempest","septamech","doubleequalizer","rigger","lorry","manufacture","doublespread","palisade"] }
            }
        };

        function getResolvedTankCode() {
            let def;
            for (const g in tankCategories) {
                if (tankCategories[g][currentTank]) { def = tankCategories[g][currentTank]; break; }
            }
            if (!def) return [currentTank];
            if (typeof def === 'string') return [currentTank];
            if (def.tanks) return def.tanks;
            return [currentTank];
        }


        let _fmSlotCounter = 0;
        let connections = getAllServers().map(() => ({ ws: null, verified: false, botCount: 0, fmSlot: _fmSlotCounter++ }));

        function extLog(msg, level) {
            const el = document.getElementById('extTerminal');
            if (!el) return;
            const cls = level === 'ok' ? 'term-ok' : level === 'warn' ? 'term-warn' : level === 'err' ? 'term-err' : 'term-dim';
            const time = new Date().toLocaleTimeString();
            const line = document.createElement('span');
            line.className = `term-line ${cls}`;
            line.textContent = `[${time}] $ ${msg}`;
            el.appendChild(line);
            while (el.children.length > 100) el.removeChild(el.firstChild);
            el.scrollTop = el.scrollHeight;
        }

        function extPacketTo(conn, ...args) {
            if (conn.ws && conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.send(msgpack.encode(args));
            }
        }

        let extActiveHash = null;

        function getExtHash() {
            return (document.getElementById('extServerHash')?.value || '').replace('#', '') || location.hash.slice(1) || 'ca3008';
        }

        function updateServerLink() {
            const linkEl = document.getElementById('extServerLink');
            if (!linkEl) return;
            if (!extActiveHash) {
                linkEl.textContent = 'no external bots spawned yet';
                linkEl.href = '#';
                return;
            }
            const url = `https://arras.io/#${extActiveHash}`;
            linkEl.textContent = url;
            linkEl.href = url;
        }

        function updateStatusUI() {
            let reporting = 0;
            getAllServers().forEach((s, i) => {
                const el = document.getElementById(`extStatus${i}`);
                const c = connections[i];
                if (!c) return;
                if (!c.ws || c.ws.readyState !== WebSocket.OPEN) {
                    c.verified = false;
                    if (el) el.textContent = '';
                } else if (c.verified) {
                    reporting++;
                    if (el) el.textContent = String(c.botCount || 0);
                } else if (el) {
                    el.textContent = '…';
                }
                const liveEl = document.getElementById(`extLiveS${i}`);
                if (liveEl) {
                    liveEl.textContent = (c.verified ? (c.botCount || 0) : '—');
                }
            });
            const total = connections.reduce((a, c) => a + (c.botCount || 0), 0);
            const el = document.getElementById('extBotCount');
            if (el) el.textContent = total;
            const rs = document.getElementById('extLiveServers');
            if (rs) rs.textContent = String(reporting);
            updateServerLink();
        }

        function connectServer(i) {
            const conn = connections[i];
            const server = getAllServers()[i];
            if (!server || !server.url) return;

            // Prevent duplicate connection attempts
            if (conn._connecting) return;
            conn._connecting = true;

            // Close existing socket
            if (conn.ws) {
                try { conn.ws.onclose = null; conn.ws.onerror = null; conn.ws.close(); } catch(e) {}
                conn.ws = null;
            }

            // Exponential backoff for reconnection
            if (!conn._retryDelay) conn._retryDelay = 2000;
            if (!conn._retryCount) conn._retryCount = 0;

            try {
                conn.ws = new NativeWebSocket(server.url);
            } catch(e) {
                conn._connecting = false;
                conn._retryCount++;
                conn._retryDelay = Math.min(30000, conn._retryDelay * 1.5);
                if (!conn._lastErrLog || Date.now() - conn._lastErrLog > 30000) {
                    conn._lastErrLog = Date.now();
                    extLog(`${server.name}: WS creation failed — ${e.message} (retry in ${(conn._retryDelay/1000).toFixed(1)}s)`, 'err');
                }
                setTimeout(() => { conn._connecting = false; connectServer(i); }, conn._retryDelay);
                return;
            }

            conn.ws.binaryType = "arraybuffer";
            let connectTimer = null;
            let openFired = false;

            connectTimer = setTimeout(() => {
                if (!openFired && conn.ws) {
                    if (!conn._lastTimeoutLog || Date.now() - conn._lastTimeoutLog > 30000) {
                        conn._lastTimeoutLog = Date.now();
                        extLog(`${server.name}: connection timeout (15s), retrying...`, 'warn');
                    }
                    try { conn.ws.onclose = null; conn.ws.close(); } catch(e) {}
                }
            }, 15000);

            conn.ws.onopen = () => {
                openFired = true;
                clearTimeout(connectTimer);
                conn._retryDelay = 2000; // reset backoff on success
                conn._retryCount = 0;
                conn._connecting = false;
                extPacketTo(conn, "M", 72011);
            };

            conn.ws.onmessage = (m) => {
                try {
                    const data = msgpack.decode(new Uint8Array(m.data));
                    const type = data.shift();
                    if (type === "M") {
                        extPacketTo(conn, "C", data[0] ^ 845);
                        conn.verified = true;
                        updateStatusUI();
                        extLog(`${server.name}: handshake verified`, 'ok');
                    } else if (type === "N") {
                        // Live bot count from this workflow server
                        const live = parseInt(data[0], 10);
                        conn.botCount = Number.isFinite(live) ? Math.max(0, live) : 0;
                        conn.totalSpawned = parseInt(data[1], 10) || conn.totalSpawned || 0;
                        updateStatusUI();
                    }
                } catch(e) {
                    extLog(`${server.name}: msgpack decode error — ${e.message}`, 'err');
                }
            };

            conn.ws.onclose = (ev) => {
                clearTimeout(connectTimer);
                conn._connecting = false;
                const wasVerified = conn.verified;
                conn.verified = false;
                conn.botCount = 0;
                updateStatusUI();

                // Don't reconnect on intentional close (code 1000 = normal, 1001 = going away)
                if (ev.code === 1000 || ev.code === 1001) {
                    extLog(`${server.name}: disconnected cleanly`, 'ok');
                    return;
                }

                conn._retryCount++;
                conn._retryDelay = Math.min(30000, conn._retryDelay * 1.5);

                if (!conn._lastCloseLog || Date.now() - conn._lastCloseLog > 30000) {
                    conn._lastCloseLog = Date.now();
                    const reason = ev.code ? `code ${ev.code}` : 'unknown';
                    extLog(`${server.name}: closed (${reason})${wasVerified ? '' : ' (never verified)'}, retry in ${(conn._retryDelay/1000).toFixed(1)}s (#${conn._retryCount})`, 'warn');
                }
                setTimeout(() => connectServer(i), conn._retryDelay);
            };

            conn.ws.onerror = (err) => {
                // Don't log every error — onclose will handle reconnection
                updateStatusUI();
            };
        }

        function extForceRespawn() {
            if (!extActiveHash) { extLog('nothing to respawn, no bots active', 'warn'); return; }
            const hash = extActiveHash;
            const counts = connections.map(c => c.botCount);
            const total = counts.reduce((a, b) => a + b, 0);
            if (total === 0) { extLog('nothing to respawn, no bots active', 'warn'); return; }

            // force respawn kill log silenced
            connections.forEach((conn) => {
                if (!conn.verified || conn.botCount === 0) return;
                extPacketTo(conn, "B");
                conn.botCount = 0;
            });
            updateStatusUI();

            setTimeout(() => {
                const tankVal = getResolvedTankCode();
                let botName = (document.getElementById('extBotName')?.value ?? "").trim();
                if (document.getElementById('extUnnamed')?.checked) botName = "";
                let respawned = false;

                connections.forEach((conn, i) => {
                    const n = counts[i];
                    if (!n || !conn.verified) return;
                    extPacketTo(conn, "Z", tankVal);
                    const pt = getSpawnPacketType();
                    const bd = typeof getExtBotBuild === 'function' ? getExtBotBuild() : '';
                    if (pt === 'F') extPacketTo(conn, 'F', hash, n, botName, bd);
                    else extPacketTo(conn, pt, hash, n, botName);
                    /* live count comes from server N packet */
                    respawned = true;
                });
                if (respawned) {
                    extActiveHash = hash;
                    // force respawn back-up log silenced
                } else {
                    // force respawn error log silenced
                }
                updateStatusUI();
            }, 1500);
        }


        let _clanTagIndex = 0;
        const LS_CLAN_TAGS = "pr_ext_clan_tags";
        function getClanTags() {
            try {
                const raw = localStorage.getItem(LS_CLAN_TAGS);
                if (raw) return JSON.parse(raw);
            } catch(e) {}
            return ['', '', '', ''];
        }
        function saveClanTags(tags) {
            localStorage.setItem(LS_CLAN_TAGS, JSON.stringify(tags));
        }
        function getNextClanTag() {
            const tags = getClanTags();
            const valid = tags.filter(t => t && t.trim());
            if (!valid.length) return '';
            const tag = valid[_clanTagIndex % valid.length];
            _clanTagIndex++;
            return tag.trim();
        }
        function buildBotName(baseName, clanTag) {
            const base = String(baseName || "").trim();
            const tag = String(clanTag || "").trim();
            if (!tag && !base) return ""; // fully unnamed
            if (!tag) return base;
            if (!base) return `[${tag}]`;
            return `[${tag}] ${base}`;
        }

        function extHuntName(name, count) {
            const n = String(name || "").trim();
            const c = Math.max(0, Math.min(2000, parseInt(count, 10) || 0));
            if (n && c > 0) {
                extSpawn(c, "all");
            }
            let sent = 0;
            connections.forEach((conn) => {
                if (!conn.verified) return;
                extPacketTo(conn, "G", n, c);
                sent++;
            });
            if (n) {
                extLog(sent ? (`Hunt "${n}"` + (c > 0 ? ` + spawn ${c}` : " (existing)") + ` ×${sent}`) : "No verified servers", sent ? "ok" : "warn");
            } else {
                extLog(sent ? "Hunt cleared" : "No verified servers", sent ? "ok" : "warn");
            }
        }

        function extSpawnDefender(count) {
            // Defenders always join *your* current party — ignore Ext Server Hash
            // (that field is only for normal follow bots on other servers/parties).
            const hash = (location.hash || "").replace(/^#/, "") || getExtHash();
            const c = Math.max(1, Math.min(2000, parseInt(count, 10) || 1));
            const baseName = (document.getElementById('extBotName')?.value ?? "").trim() || "Defender";
            let spawned = false;
            connections.forEach((conn) => {
                if (!conn.verified) return;
                extPacketTo(conn, "D", hash, c, baseName);
                /* live count comes from server N packet */
                spawned = true;
            });
            if (spawned) { extActiveHash = hash; }
            extLog(spawned ? `Spawned ${c} defenders on your hash (#${hash})` : "No verified servers", spawned ? "ok" : "warn");
            updateStatusUI();
        }



        function getSpawnPacketType() {
            return document.getElementById('extSpawnMode')?.value === 'protocol' ? 'P' : 'F';
        }

        function getExtBotBuild() {
            if (document.getElementById('extUnnamed')?.checked) {
                /* unnamed does not clear build */
            }
            const val = (document.getElementById('extBotBuild')?.value ?? "").trim();
            if (val && !/^[0-9]+(\/[0-9]+)*$/.test(val)) return "";
            return val;
        }

        function extSpawn(count, serverIdx) {
            const hash = getExtHash();
            const tankVal = getResolvedTankCode();
            let baseName = (document.getElementById('extBotName')?.value ?? "").trim();
            if (document.getElementById('extUnnamed')?.checked) baseName = "";
            const packetType = getSpawnPacketType();
            const botBuild = getExtBotBuild();
            // F: hash, count, name, build  |  P: hash, count, name, delay
            const spawnArgs = packetType === 'P'
                ? [hash, count, undefined, 1]
                : [hash, count, "", botBuild];
            if (serverIdx === 'all') {
                let spawned = false;
                const allServers = getAllServers();
                connections.forEach((conn, i) => {
                    if (i >= allServers.length) return;
                    if (!conn.verified) { return; }
                    const clanTag = getNextClanTag();
                    const botName = buildBotName(baseName, clanTag);
                    spawnArgs[2] = botName;
                    if (packetType === 'F') spawnArgs[3] = botBuild;
                    extPacketTo(conn, "Z", tankVal);
                    extPacketTo(conn, packetType, ...spawnArgs);
                    /* live count comes from server N packet */
                    spawned = true;
                });
                if (spawned) { extActiveHash = hash; }
            } else {
                const conn = connections[serverIdx];
                if (!conn.verified) { return; }
                const clanTag = getNextClanTag();
                const botName = buildBotName(baseName, clanTag);
                spawnArgs[2] = botName;
                if (packetType === 'F') spawnArgs[3] = botBuild;
                extPacketTo(conn, "Z", tankVal);
                extPacketTo(conn, packetType, ...spawnArgs);
                /* live count comes from server N packet */
                extActiveHash = hash;
            }
            updateStatusUI();
        }



        function extKill(serverIdx) {
            if (serverIdx === 'all') {
                connections.forEach((conn, i) => {
                    if (!conn.verified) return;
                    extPacketTo(conn, "B");
                    conn.botCount = 0;
                });
                extActiveHash = null;
                // kill log silenced
            } else {
                const conn = connections[serverIdx];
                if (!conn.verified) return;
                extPacketTo(conn, "B");
                conn.botCount = 0;
                // kill log silenced
            }
            updateStatusUI();
        }

        let spinAngle = 0;
        let _extFmCache = null;

        function extSendPos() {
            if (connections.every(c => !c.verified)) return;
            try {
                const px = (typeof player !== 'undefined' && player.x) ? player.x : extPlayerX;
                const py = (typeof player !== 'undefined' && player.y) ? player.y : extPlayerY;
                const fov = (typeof globalFov !== 'undefined' && globalFov) ? globalFov : extGameFOV;
                const cx = (typeof center !== 'undefined') ? center.x : innerWidth / 2;
                const cy = (typeof center !== 'undefined') ? center.y : innerHeight / 2;
                const mx = (typeof mouse !== 'undefined') ? mouse.x : extMouseX;
                const my = (typeof mouse !== 'undefined') ? mouse.y : extMouseY;

                const autofire = document.getElementById('extAutofire')?.checked;
                const holdRmb = document.getElementById('extHoldRmb')?.checked;
                const feedingMode = document.getElementById('extFeeding')?.checked;
                const spin = document.getElementById('extSpin')?.checked;
                const overrideR = document.getElementById('extOverride')?.checked;
                const wavyMove = document.getElementById('extWavy')?.checked ?? true;
                const copyAim = document.getElementById('extCopyAim')?.checked ?? true;
                const mbs = document.getElementById('extMbs')?.checked ? 1 : 0;
                const noMove = document.getElementById('extNoMove')?.checked;
                const noAim = document.getElementById('extNoAim')?.checked;
                const manualMode = document.getElementById('extManualMode')?.checked;
                const manualPx = parseFloat(document.getElementById('extManualX')?.value) || 0;
                const manualPy = parseFloat(document.getElementById('extManualY')?.value) || 0;
                const sensitivity = parseFloat(document.getElementById('extSensitivity')?.value) || 20;

                const lmbBase = (typeof mouse !== 'undefined' && mouse.buttons) ? (mouse.buttons[0] ? 1 : 0) : (extMouseDown ? 1 : 0);
                const rmbBase = (typeof mouse !== 'undefined' && mouse.buttons) ? (mouse.buttons[2] ? 1 : 0) : (extRMouseDown ? 1 : 0);

                // Block lmb while feeding so bots don't shoot you mid-feed
                const lmb = feedingMode ? 0 : (autofire ? 1 : lmbBase);
                const rmb = (holdRmb || feedingMode) ? 1 : rmbBase;const feeding = feedingMode ? 1 : 0;
const shift = 0;


                // Spin angle update
                if (spin) spinAngle += 0.15;

                // Formation offset calculation (from message script)
                const verifiedConns = connections.filter(c => c.verified).sort((a, b) => a.fmSlot - b.fmSlot);
                const n = verifiedConns.length;
                const fmEnabled = formationConfig.enabled && n > 1 && !manualMode && !noMove;
                let fmOffsets = null;
                if (fmEnabled) {
                    const sp = formationConfig.spacing || 60;
                    const typ = formationConfig.type;
                    const scaledDist = sp / 10;

                    // Aim direction unit vector
                    let aimUx = 1, aimUy = 0;
                    const aimDx = mx - cx, aimDy = my - cy;
                    const aimLen = Math.hypot(aimDx, aimDy);
                    if (aimLen > 0.001) { aimUx = aimDx / aimLen; aimUy = aimDy / aimLen; }

                    // Build/cache the text point-cloud only when needed
                    let textPoints = null;
                    if (typ === 'text') {
                        const wantText = formationConfig.text || 'PR';
                        if (!_extTextPointCache || _extTextPointCache.text !== wantText) {
                            _extTextPointCache = { text: wantText, points: _buildTextPoints(wantText) };
                        }
                        textPoints = _extTextPointCache.points;
                    }

                    const dirChanged = !_extFmCache || Math.abs(aimUx - (_extFmCache.ux||0)) > 0.05 || Math.abs(aimUy - (_extFmCache.uy||0)) > 0.05;
                    if (!_extFmCache || _extFmCache.n !== n || _extFmCache.sp !== sp || _extFmCache.typ !== typ || _extFmCache.txt !== formationConfig.text || dirChanged) {
                        _extFmCache = {
                            n, sp, typ, txt: formationConfig.text, ux: aimUx, uy: aimUy,
                            offsets: Array.from({ length: n }, (_, i) => {
                                const index = i + 1;
                                switch (typ) {
                                    case 'line_front':  return { dx:  aimUx * (scaledDist * index), dy:  aimUy * (scaledDist * index) };
                                    case 'line_behind': return { dx: -aimUx * (scaledDist * index), dy: -aimUy * (scaledDist * index) };
                                    case 'line_top':    return { dx:  aimUy * (scaledDist * index), dy: -aimUx * (scaledDist * index) };
                                    case 'line_bottom': return { dx: -aimUy * (scaledDist * index), dy:  aimUx * (scaledDist * index) };
                                    case 'circle':      { const r = scaledDist + (n * 0.5); const ang = (Math.PI * 2 / n) * index; return { dx: Math.cos(ang) * r, dy: Math.sin(ang) * r }; }
                                    case 'star':        { const spokes = 5; const ang = (Math.PI * 2 / n) * index; const r = (scaledDist + n * 0.3) * (0.55 + 0.45 * Math.cos(spokes * ang)); return { dx: Math.cos(ang) * r, dy: Math.sin(ang) * r }; }
                                    case 'heart':       { const t = (Math.PI * 2 / n) * index; const hs = (scaledDist + n * 0.15) * 0.9; const hx = 16 * Math.pow(Math.sin(t), 3); const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); return { dx: hx * (hs / 16), dy: hy * (hs / 16) }; }
                                    case 'text':        { if (!textPoints || !textPoints.length) return { dx: 0, dy: 0 }; const pIdx = Math.min(Math.floor(((index - 1) / n) * textPoints.length), textPoints.length - 1); const pt = textPoints[pIdx]; const textScale = sp / 600; return { dx: pt.x * textScale, dy: pt.y * textScale }; }
                                    default:            return { dx: 0, dy: 0 };
                                }
                            })
                        };
                    }
                    fmOffsets = _extFmCache.offsets;
                } else {
                    _extFmCache = null;
                }

                verifiedConns.forEach((c, ci) => {
                    setTimeout(() => {
                        let mwx, mwy;
                        if (spin) {
                            const jitter = (Math.random() - 0.5) * 0.1;
                            mwx = Math.cos(spinAngle + jitter) * fov * 0.8;
                            mwy = Math.sin(spinAngle + jitter) * fov * 0.8;
                        } else {
                            const jitterX = (Math.random() - 0.5) * 0.8;
                            const jitterY = (Math.random() - 0.5) * 0.8;
                            const aimScale = sensitivity / 20;
                            mwx = ((mx - cx) / cx * fov + jitterX) * aimScale;
                            mwy = ((my - cy) / cy * fov * (innerHeight / innerWidth) + jitterY) * aimScale;
                        }
                        const offsetX = noMove ? 0 : (Math.random() - 0.5) * 3;
                        const offsetY = noMove ? 0 : (Math.random() - 0.5) * 3;
                        let finalPx, finalPy;
                        if (manualMode) {
                            finalPx = manualPx; finalPy = manualPy;
                        } else if (noMove) {
                            finalPx = 0; finalPy = 0;
                        } else if (fmEnabled && fmOffsets && fmOffsets[ci]) {
                            finalPx = px + fmOffsets[ci].dx + offsetX;
                            finalPy = py + fmOffsets[ci].dy + offsetY;
                        } else {
                            finalPx = px + offsetX;
                            finalPy = py + offsetY;
                        }
                        const finalMwx = noAim ? 0 : mwx;
                        const finalMwy = noAim ? 0 : mwy;
                        // A: ... noMove, override(R), wavy, wavyAmp, wavyFreq, copyAim
                        extPacketTo(c, "A", finalPx, finalPy, finalMwx, finalMwy, lmb, rmb, mbs, feeding, shift, autofire ? 1 : 0, spin ? 1 : 0, manualMode ? 1 : 0, manualPx, manualPy, noMove ? 1 : 0, overrideR ? 1 : 0, wavyMove ? 1 : 0, 6, 3.927, copyAim ? 1 : 0);

                    }, Math.random() * 150);
                });
            } catch(e) {
                connections.forEach(c => extPacketTo(c, "A", 0, 0, 0, 0, 0, 0, 1, 0, 0));
            }
        }

        function scheduleNextUpdate() {
            setTimeout(() => {
                extSendPos();
                scheduleNextUpdate();
            }, 180 + Math.random() * 80);
        }

        //  Popup background hider (kill/assist backgrounds) 
        function _isPopupShape(x, y, w, h, ctx) {
            if (!(hideKillMessages || hideAssistMessages)) return false;
            if (performance.now() > _popupSkipUntil) return false;
            if (!ctx || !ctx.canvas) return false;
            const cw = ctx.canvas.width || innerWidth;
            const ch = ctx.canvas.height || innerHeight;
            const cx = x + (w || 0) / 2;
            const isCentered = Math.abs(cx - cw / 2) < cw * 0.35;
            const isTopHalf = y < ch * 0.60;
            const isReasonableSize = (w > 60 && w < 1200) && (h > 12 && h < 120);
            return isCentered && isTopHalf && isReasonableSize;
        }

        const _origFillRect = CanvasRenderingContext2D.prototype.fillRect;
        CanvasRenderingContext2D.prototype.fillRect = function(x, y, w, h) {
            if (_isPopupShape(x, y, w, h, this)) return;
            return _origFillRect.apply(this, arguments);
        };

        const _origStrokeRect = CanvasRenderingContext2D.prototype.strokeRect;
        CanvasRenderingContext2D.prototype.strokeRect = function(x, y, w, h) {
            if (_isPopupShape(x, y, w, h, this)) return;
            return _origStrokeRect.apply(this, arguments);
        };

        const _origRoundRect2 = CanvasRenderingContext2D.prototype.roundRect;
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
            if (_isPopupShape(x, y, w, h, this)) return;
            return _origRoundRect2.apply(this, arguments);
        };

        const _origStroke = CanvasRenderingContext2D.prototype.stroke;
        CanvasRenderingContext2D.prototype.stroke = function() {
            if (_skipPathOperations > 0) { _skipPathOperations--; return; }
            return _origStroke.apply(this, arguments);
        };
        // 

        // Hook strokeText for coordinates
        const _origST = CanvasRenderingContext2D.prototype.strokeText;
        CanvasRenderingContext2D.prototype.strokeText = function(...args) {
            const txt = args[0] ? String(args[0]) : '';
            if (hideKillMessages && txt.startsWith(KILL_PREFIX)) {
                _popupSkipUntil = performance.now() + 120;
                return;
            }
            if (hideAssistMessages && (txt.startsWith(ASSIST_PREFIX) || txt.startsWith("You assissted "))) {
                _popupSkipUntil = performance.now() + 120;
                return;
            }
            if (args[0] && args[0].includes("Coordinates: (")) {
                try {
                    const m = args[0].match(/Coordinates: \(([^)]+)\)/);
                    if (m) { const p = m[1].split(", "); extPlayerX = parseFloat(p[0]); extPlayerY = parseFloat(p[1]); }
                } catch(e) {}
            }
            return _origST.apply(this, args);
        };

        document.addEventListener("mousemove", e => { extMouseX = e.clientX; extMouseY = e.clientY; });
        document.addEventListener("mousedown", e => { if (e.button === 0) extMouseDown = true; if (e.button === 2) extRMouseDown = true; });
        document.addEventListener("mouseup", e => { if (e.button === 0) extMouseDown = false; if (e.button === 2) extRMouseDown = false; });

        setInterval(updateStatusUI, 2000);
        scheduleNextUpdate();
        getAllServers().forEach((s, i) => connectServer(i));

        function wireExtBots() {
            updateServerLink();


            // Sing full lyrics UI
            const DEFAULT_SING_LYRICS = ["Georgia, wrap me up in all your-", "I want you in my arms", "Oh, let me hold you", "I'll never let you go again like I did", "Oh, I used to say", "I would never fall in love again until I found her", "I said I would never fall unless it's you I fall into", "I was lost within the darkness, but then I found her", "I found you", "Georgia, take me hold, take me hold, take me hold", "Take me hold, take me hold, take me hold", "Take me hold, take me hold, take me hold", "Take me hold, take me hold", "I would never fall in love again until I found her", "I said I would never fall unless it's you I fall into", "I was lost within the darkness, but then I found her", "I found you", "I found you", "Oh yeah", "I found you", "Heaven is a place that I can't describe", "When she walks in the room, I lose my mind", "God knows I try to put my finger on it", "But I come up short every time", "I used to say", "I would never fall in love again until I found her", "I said I would never fall unless it's you I fall into", "I was lost within the darkness, but then I found her", "I found you", "I found you", "Oh yeah", "I found you"];
            const extSingLyrics = document.getElementById('extSingLyrics');
            const extSingStatus = document.getElementById('extSingStatus');
            try {
                const saved = localStorage.getItem('pr_ext_sing_lyrics');
                if (extSingLyrics) extSingLyrics.value = saved || DEFAULT_SING_LYRICS.join('\n');
            } catch (e) {
                if (extSingLyrics) extSingLyrics.value = DEFAULT_SING_LYRICS.join('\n');
            }
            function extSingSet(enabled) {
                const raw = (extSingLyrics?.value || '').split(/\n/).map(s => s.trim()).filter(Boolean);
                const delay = parseInt(document.getElementById('extSingDelay')?.value, 10) || 4000;
                let sent = 0;
                connections.forEach((conn) => {
                    if (!conn.verified) return;
                    extPacketTo(conn, 'Y', enabled ? 1 : 0, raw, delay);
                    sent++;
                });
                if (extSingStatus) {
                    extSingStatus.textContent = enabled
                        ? `Singing ${raw.length} lines → ${sent} server(s) · ${delay}ms/line`
                        : 'Stopped';
                    extSingStatus.style.color = enabled ? '#c084fc' : '#94a3b8';
                }
                try { localStorage.setItem('pr_ext_sing_lyrics', extSingLyrics?.value || ''); } catch (e) {}
                extLog(enabled ? `Sing ON (${raw.length} lines)` : 'Sing OFF', enabled ? 'ok' : 'warn');
            }
            document.getElementById('extSingStart')?.addEventListener('click', () => extSingSet(true));
            document.getElementById('extSingStop')?.addEventListener('click', () => extSingSet(false));

            document.getElementById('extChatSend')?.addEventListener('click', () => {
    const msg = document.getElementById('extChatMsg')?.value?.trim();
    if (msg) extChat(msg, false);
});
document.getElementById('extChatSpam')?.addEventListener('click', () => {
    const msg = document.getElementById('extChatMsg')?.value?.trim();
    if (msg) extChat(msg, true);
});
document.getElementById('extChatStop')?.addEventListener('click', () => {
    extChat("", false);
});
            document.getElementById('extHuntGo')?.addEventListener('click', () => {
                const name = document.getElementById('extHuntName')?.value?.trim() || "";
                const count = parseInt(document.getElementById('extHuntCount')?.value, 10) || 0;
                if (!name) { extLog("Enter a name to hunt", "warn"); return; }
                extHuntName(name, count);
            });
            document.getElementById('extHuntStop')?.addEventListener('click', () => {
                extHuntName("", 0);
                const el = document.getElementById('extHuntName');
                if (el) el.value = "";
            });
            document.getElementById('extHuntName')?.addEventListener('keydown', (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const name = document.getElementById('extHuntName')?.value?.trim() || "";
                    const count = parseInt(document.getElementById('extHuntCount')?.value, 10) || 0;
                    if (name) extHuntName(name, count);
                }
            });
            document.getElementById('extSpawnCustom')?.addEventListener('click', () => {
    const count = parseInt(document.getElementById('extCustomCount')?.value) || 50;
    extSpawn(count, 'all');
});



            // --- Searchable Tank Dropdown ---
            function populateTankOptions(filter = "") {
                const list = document.getElementById('extTankOptionsList');
                if (!list) return;
                list.innerHTML = "";
                const q = filter.toLowerCase();
                for (const gName in tankCategories) {
                    const matches = [];
                    for (const k in tankCategories[gName]) {
                        const d = tankCategories[gName][k];
                        const n = typeof d === "string" ? d : d.name;
                        if (n.toLowerCase().includes(q) || k.toLowerCase().includes(q)) matches.push({ key: k, name: n });
                    }
                    if (matches.length) {
                        const lbl = document.createElement("div");
                        lbl.className = "ext-tank-dg";
                        lbl.textContent = gName;
                        list.appendChild(lbl);
                        matches.forEach(m => {
                            const item = document.createElement("div");
                            item.className = "ext-tank-di" + (m.key === currentTank ? " sel" : "");
                            item.textContent = m.name;
                            item.onclick = e => { e.stopPropagation(); selectTank(m.key); };
                            list.appendChild(item);
                        });
                    }
                }
            }

            function selectTank(key) {
                if (key) currentTank = key;
                const display = document.getElementById('extSelectedTankDisplay');
                if (display) {
                    let def;
                    for (const g in tankCategories) { if (tankCategories[g][currentTank]) { def = tankCategories[g][currentTank]; break; } }
                    display.textContent = def ? (typeof def === "string" ? def : def.name) : currentTank;
                }
                closeTankDropdown();
                const tankVal = getResolvedTankCode();
                connections.forEach(c => { if (c.verified) extPacketTo(c, "Z", tankVal); });
            }

            function positionTankDropdown() {
                const list = document.getElementById('extTankOptionsList');
                const trigger = document.getElementById('extTankTrigger');
                if (!list || !trigger || list.style.display === 'none') return;
                const rect = trigger.getBoundingClientRect();
                list.style.top = (rect.bottom + 4) + 'px';
                list.style.left = rect.left + 'px';
                list.style.width = rect.width + 'px';
            }

            function openTankDropdown() {
                const list = document.getElementById('extTankOptionsList');
                const display = document.getElementById('extSelectedTankDisplay');
                const input = document.getElementById('extTankSearchInput');
                const arrow = document.getElementById('extTankArrow');
                if (list) list.style.display = "block";
                if (display) display.style.display = "none";
                if (input) { input.style.display = "block"; input.value = ""; input.focus(); }
                if (arrow) arrow.textContent = "";
                positionTankDropdown();
                populateTankOptions();
            }

            function closeTankDropdown() {
                const list = document.getElementById('extTankOptionsList');
                const display = document.getElementById('extSelectedTankDisplay');
                const input = document.getElementById('extTankSearchInput');
                const arrow = document.getElementById('extTankArrow');
                if (list) list.style.display = "none";
                if (display) display.style.display = "block";
                if (input) input.style.display = "none";
                if (arrow) arrow.textContent = "";
            }

            const tankTrigger = document.getElementById('extTankTrigger');
            const tankSearch = document.getElementById('extTankSearchInput');
            if (tankTrigger) {
                tankTrigger.onclick = e => {
                    e.stopPropagation();
                    const list = document.getElementById('extTankOptionsList');
                    if (list && list.style.display === 'block') closeTankDropdown();
                    else openTankDropdown();
                };
            }
            if (tankSearch) {
                tankSearch.oninput = () => populateTankOptions(tankSearch.value);
                tankSearch.onkeydown = e => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                        e.preventDefault();
                        const list = document.getElementById('extTankOptionsList');
                        if (list) { const fi = list.querySelector(".ext-tank-di"); if (fi) fi.click(); }
                    }
                };
            }
            window.addEventListener("click", e => {
                const container = document.getElementById('extTankContainer');
                const list = document.getElementById('extTankOptionsList');
                if (container && list && !container.contains(e.target) && !list.contains(e.target)) closeTankDropdown();
            });
            window.addEventListener("resize", positionTankDropdown);
            window.addEventListener("scroll", positionTankDropdown, true);

            selectTank(currentTank);

            document.querySelectorAll('.ext-quick-tank').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const key = btn.getAttribute('data-tank');
                    if (key && typeof selectTank === 'function') {
                        selectTank(key);
                        extLog('Tank: ' + (btn.textContent || key), 'ok');
                    }
                });
            });

            // Ext bot stat build override
            const LS_EXT_BUILD = 'pr_ext_bot_build';
            const extBuildInput = document.getElementById('extBotBuild');
            const extBuildStatus = document.getElementById('extBotBuildStatus');
            try {
                const saved = localStorage.getItem(LS_EXT_BUILD);
                if (saved && extBuildInput) extBuildInput.value = saved;
            } catch (e) {}

            function pushExtBuild(buildStr) {
                const val = (buildStr || '').trim();
                let sent = 0;
                connections.forEach((conn) => {
                    if (!conn.verified) return;
                    extPacketTo(conn, 'S', val);
                    sent++;
                });
                if (extBuildStatus) {
                    extBuildStatus.textContent = val
                        ? `Build set: ${val} → ${sent} server(s)`
                        : `Using tank default build → ${sent} server(s)`;
                    extBuildStatus.style.color = val ? '#4ade80' : '#94a3b8';
                }
                try {
                    if (val) localStorage.setItem(LS_EXT_BUILD, val);
                    else localStorage.removeItem(LS_EXT_BUILD);
                } catch (e) {}
                extLog(val ? `Bot build: ${val}` : 'Bot build: tank default', 'ok');
            }

            document.getElementById('extBotBuildApply')?.addEventListener('click', () => {
                const val = (extBuildInput?.value || '').trim();
                if (val && !/^[0-9]+(\/[0-9]+)*$/.test(val)) {
                    if (extBuildStatus) {
                        extBuildStatus.textContent = 'Invalid — use like 0/4/3/8/8/9/7/4';
                        extBuildStatus.style.color = '#f87171';
                    }
                    return;
                }
                pushExtBuild(val);
            });
            document.getElementById('extBotBuildClear')?.addEventListener('click', () => {
                if (extBuildInput) extBuildInput.value = '';
                pushExtBuild('');
            });
            // Push saved build on connect cycle
            if (extBuildInput?.value?.trim()) {
                setTimeout(() => pushExtBuild(extBuildInput.value.trim()), 2500);
            }
            // --- End Searchable Tank Dropdown ---

            function connectAllExtServers() {
                const all = getAllServers();
                let n = 0;
                all.forEach((s, i) => {
                    if (!s || !s.url) return;
                    connectServer(i);
                    n++;
                });
                extLog(n ? `Connecting to ${n} server(s)…` : 'No servers to connect', n ? 'ok' : 'warn');
                setTimeout(updateStatusUI, 800);
                setTimeout(updateStatusUI, 2500);
            }
            document.getElementById('extReconnectAll')?.addEventListener('click', connectAllExtServers);
            document.getElementById('extConnectAllTop')?.addEventListener('click', connectAllExtServers);

            // Clan tag inputs
            const clanInputs = ['extClanTag1','extClanTag2','extClanTag3','extClanTag4'];
            const savedTags = getClanTags();
            clanInputs.forEach((id, i) => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = savedTags[i] || '';
                    el.addEventListener('input', () => {
                        const tags = clanInputs.map(cid => document.getElementById(cid)?.value || '');
                        saveClanTags(tags);
                    });
                }
            });

            document.getElementById('extAddServer')?.addEventListener('click', () => {
                const nameEl = document.getElementById('extCustomServerName');
                const urlEl = document.getElementById('extCustomServerUrl');
                const baseName = nameEl?.value?.trim() || '';
                const rawUrls = urlEl?.value?.trim() || '';
                if (!rawUrls) { extLog('Enter at least one server URL', 'warn'); return; }
                const urls = rawUrls.split(/\n+/).map(u => u.trim()).filter(u => u.length > 0);
                if (urls.length === 0) { extLog('Enter at least one server URL', 'warn'); return; }
                let addedCount = 0;
                urls.forEach((url, idx) => {
                    const name = baseName ? (urls.length > 1 ? `${baseName} ${idx + 1}` : baseName) : '';
                    const fixedUrl = addCustomServer(name, url);
                    addedCount++;
                });
                // Rebuild connections array for new servers (but don't auto-connect)
                const all = getAllServers();
                while (connections.length < all.length) {
                    connections.push({ ws: null, verified: false, botCount: 0, fmSlot: _fmSlotCounter++ });
                }
                extLog(`Added ${addedCount} server${addedCount > 1 ? 's' : ''} — click Connect to link`, 'ok');
                if (urlEl) urlEl.value = '';
                if (nameEl) nameEl.value = '';
                updateCustomServerList();
            });

            function updateCustomServerList() {
                const container = document.getElementById('extCustomServerList');
                if (!container) return;
                if (customServers.length === 0) { container.innerHTML = ''; return; }
                container.innerHTML = customServers.map((s, i) => {
                    const connIdx = SERVERS.length + i;
                    const isConnected = connections[connIdx] && connections[connIdx].ws && connections[connIdx].ws.readyState === WebSocket.OPEN && connections[connIdx].verified;
                    const statusColor = isConnected ? '#60a5fa' : '#94a3b8';
                    const statusText = isConnected ? '' : '⏸';
                    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 6px;background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.1);border-radius:3px;margin:2px 0;gap:6px;">
                        <span style="color:#94a3b8;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${statusText} ${s.name}: <span style="color:#3b82f6;">${s.url}</span></span>
                        <button data-idx="${i}" class="ext-connect-server" style="background:rgba(96,165,250,0.15);border:1px solid rgba(96,165,250,0.4);color:#60a5fa;border-radius:3px;padding:1px 8px;font-size:10px;cursor:pointer;white-space:nowrap;"> Connect</button>
                        <button data-idx="${i}" class="ext-remove-server" style="background:rgba(220,38,38,0.2);border:1px solid rgba(220,38,38,0.4);color:#f87171;border-radius:3px;padding:1px 6px;font-size:10px;cursor:pointer;"></button>
                    </div>`;
                }).join('');

                container.querySelectorAll('.ext-connect-server').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.idx);
                        const connIdx = SERVERS.length + idx;
                        const s = customServers[idx];
                        if (connections[connIdx]?.ws) {
                            try { connections[connIdx].ws.close(); } catch(e) {}
                        }
                        extLog(`Connecting to ${s.name}...`, 'ok');
                        connectServer(connIdx);
                        setTimeout(updateCustomServerList, 500);
                    });
                });

                container.querySelectorAll('.ext-remove-server').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.idx);
                        const s = customServers[idx];
                        const connIdx = SERVERS.length + idx;
                        if (connections[connIdx]?.ws) {
                            try { connections[connIdx].ws.close(); } catch(e) {}
                        }
                        removeCustomServer(idx);
                        connections = getAllServers().map(() => ({ ws: null, verified: false, botCount: 0 }));
                        extLog(`Removed server: ${s?.name || 'custom'}`, 'ok');
                        updateCustomServerList();
                        updateStatusUI();
                    });
                });
            }
            updateCustomServerList();
            document.getElementById('extSpawnAll1')?.addEventListener('click', () => extSpawn(1, 'all'));
            document.getElementById('extSpawnAll5')?.addEventListener('click', () => extSpawn(5, 'all'));
            document.getElementById('extSpawnAll10')?.addEventListener('click', () => extSpawn(10, 'all'));

            document.getElementById('extSpawnDefender')?.addEventListener('click', () => {
                const n = document.getElementById('extDefenderCount')?.value || 10;
                extSpawnDefender(n);
            });
            document.getElementById('extKillAll')?.addEventListener('click', () => extKill('all'));
            document.getElementById('extForceRespawn')?.addEventListener('click', () => extForceRespawn());
            document.getElementById('extSpawn1s1')?.addEventListener('click', () => extSpawn(1, 0));
            document.getElementById('extSpawn5s1')?.addEventListener('click', () => extSpawn(5, 0));
            document.getElementById('extSpawn10s1')?.addEventListener('click', () => extSpawn(10, 0));
            document.getElementById('extKill1')?.addEventListener('click', () => extKill(0));
            document.getElementById('extSpawn1s2')?.addEventListener('click', () => extSpawn(1, 1));
            document.getElementById('extSpawn5s2')?.addEventListener('click', () => extSpawn(5, 1));
            document.getElementById('extSpawn10s2')?.addEventListener('click', () => extSpawn(10, 1));
            document.getElementById('extKill2')?.addEventListener('click', () => extKill(1));
            document.getElementById('extSpawn1s3')?.addEventListener('click', () => extSpawn(1, 2));
            document.getElementById('extSpawn5s3')?.addEventListener('click', () => extSpawn(5, 2));
            document.getElementById('extSpawn10s3')?.addEventListener('click', () => extSpawn(10, 2));
            document.getElementById('extKill3')?.addEventListener('click', () => extKill(2));
            document.getElementById('extSpawn1s4')?.addEventListener('click', () => extSpawn(1, 3));
            document.getElementById('extSpawn5s4')?.addEventListener('click', () => extSpawn(5, 3));
            document.getElementById('extSpawn10s4')?.addEventListener('click', () => extSpawn(10, 3));
            document.getElementById('extKill4')?.addEventListener('click', () => extKill(3));

            // Aim smoothing slider
            const extSens = document.getElementById('extSensitivity');
            const extSensVal = document.getElementById('extSensitivityValue');
            if (extSens && extSensVal) {
                extSens.addEventListener('input', () => { extSensVal.textContent = extSens.value; });
            }

            // Manual coords mode toggle
            const extManualMode = document.getElementById('extManualMode');
            const extManualSection = document.getElementById('extManualCoordsSection');
            if (extManualMode && extManualSection) {
                extManualMode.addEventListener('change', () => {
                    extManualSection.style.display = extManualMode.checked ? 'block' : 'none';
                });
            }

            // Formation toggle + sync to formationConfig
            const extFmEnabled = document.getElementById('extFormationEnabled');
            const extFmSection = document.getElementById('extFormationSection');
            const extSpawnModeEl = document.getElementById('extSpawnMode');
            if (extSpawnModeEl) {
                extSpawnModeEl.value = localStorage.getItem('pr_spawn_mode') || 'hybrid';
                extSpawnModeEl.addEventListener('change', () => {
                    localStorage.setItem('pr_spawn_mode', extSpawnModeEl.value);
                });
            }

            const extFmType = document.getElementById('extFormationType');
            const extFmSpacing = document.getElementById('extFormationSpacing');
            const extFmSpacingVal = document.getElementById('extFormationSpacingVal');
            const extFmText = document.getElementById('extFormationText');
            const extFmTextWrap = document.getElementById('extFormationTextWrap');

            // Init UI from existing formationConfig state
            if (extFmEnabled) extFmEnabled.checked = formationConfig.enabled;
            if (extFmSection) extFmSection.style.display = formationConfig.enabled ? 'block' : 'none';
            if (extFmType) extFmType.value = formationConfig.type;
            if (extFmSpacing) extFmSpacing.value = formationConfig.spacing;
            if (extFmSpacingVal) extFmSpacingVal.textContent = formationConfig.spacing;
            if (extFmText) extFmText.value = formationConfig.text || '';
            if (extFmTextWrap) extFmTextWrap.style.display = (formationConfig.type === 'text') ? 'block' : 'none';

            extFmEnabled?.addEventListener('change', () => {
                formationConfig.enabled = extFmEnabled.checked;
                if (extFmSection) extFmSection.style.display = extFmEnabled.checked ? 'block' : 'none';
                localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
            });
            extFmType?.addEventListener('change', () => {
                formationConfig.type = extFmType.value;
                if (extFmTextWrap) extFmTextWrap.style.display = (extFmType.value === 'text') ? 'block' : 'none';
                localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
            });
            extFmSpacing?.addEventListener('input', () => {
                formationConfig.spacing = parseInt(extFmSpacing.value);
                if (extFmSpacingVal) extFmSpacingVal.textContent = extFmSpacing.value;
                localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
            });
            extFmText?.addEventListener('input', () => {
                formationConfig.text = extFmText.value || 'PR';
                _extFmCache = null; // force point-cloud rebuild for new text
                localStorage.setItem(LS_FORMATION_CONFIG, JSON.stringify(formationConfig));
            });

        }

        setTimeout(wireExtBots, 2000);
    })();

        window._test = events;

    // Receive macro commands broadcast from parent tab
    window.addEventListener('storage', (e) => {
        if (e.key === 'botCommand') {
            try {
                const cmd = JSON.parse(e.newValue);
                if (cmd && cmd.type === 'upgrade' && window.__is_bot) {
                    performMacroUpgrade(cmd.macro);
                }
            } catch(err) {}
        }
    });
}

if (checkAuth()) {
    initCheatScript();
} else {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showAuthModal);
    } else {
        showAuthModal();
    }
}
