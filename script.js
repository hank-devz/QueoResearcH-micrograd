// ==========================================
// 1. SILNIK MICROGRAD (Uproszczona wersja JS)
// ==========================================
class Value {
    constructor(data, _children = [], _op = '') {
        this.data = data;
        this.grad = 0.0;
        this._backward = () => {};
        this._prev = new Set(_children);
        this._op = _op;
    }

    add(other) {
        other = other instanceof Value ? other : new Value(other);
        const out = new Value(this.data + other.data, [this, other], '+');
        
        out._backward = () => {
            this.grad += out.grad;
            other.grad += out.grad;
        };
        return out;
    }

    mul(other) {
        other = other instanceof Value ? other : new Value(other);
        const out = new Value(this.data * other.data, [this, other], '*');

        out._backward = () => {
            this.grad += other.data * out.grad;
            other.grad += this.data * out.grad;
        };
        return out;
    }

    backward() {
        const topo = [];
        const visited = new Set();
        
        function buildTopo(v) {
            if (!visited.has(v)) {
                visited.add(v);
                for (const child of v._prev) {
                    buildTopo(child);
                }
                topo.push(v);
            }
        }
        
        buildTopo(this);
        this.grad = 1.0;
        
        for (let i = topo.length - 1; i >= 0; i--) {
            topo[i]._backward();
        }
    }
}

// ==========================================
// 2. OBSŁUGA INTERFEJSU GRAFU (Index Page)
// ==========================================
if (document.getElementById('run-grad-btn')) {
    document.getElementById('run-grad-btn').addEventListener('click', () => {
        const xVal = parseFloat(document.getElementById('input-x').value);
        const wVal = parseFloat(document.getElementById('input-w').value);
        const bVal = parseFloat(document.getElementById('input-b').value);

        // Forward pass
        const x = new Value(xVal);
        const w = new Value(wVal);
        const b = new Value(bVal);
        
        const xw = x.mul(w);
        const f = xw.add(b);

        // Backward pass
        f.backward();

        // Render logów w czytelny dla inżyniera sposób
        const logBox = document.getElementById('output-log');
        logBox.innerHTML = `
=== FORWARD PASS ===
Wynik f(x,w) = ${f.data.toFixed(4)}   (xw: ${xw.data.toFixed(4)})

=== BACKWARD PASS (GRADIENTY) ===
df/df (Zawsze 1.0) : ${f.grad.toFixed(1)}
df/db (Bias grad)  : ${b.grad.toFixed(1)}
df/dx (Input grad) : ${x.grad.toFixed(1)}  (równe wadze w)
df/dw (Weight grad): ${w.grad.toFixed(1)}  (równe wejściu x)
        `.trim();
    });
}

// ==========================================
// 3. SYSTEM LOGOWANIA & PANELU (Prosty Mock)
// ==========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        // Prosta weryfikacja "na sztywno" dla środowiska testowego Qeoresearch
        if (user === 'hank-devz' && pass === 'qeor9') {
            localStorage.setItem('qeoresearch_auth', 'true');
            localStorage.setItem('qeoresearch_user', user);
            window.location.href = 'dashboard.html';
        } else {
            const errorMsg = document.getElementById('login-error');
            errorMsg.classList.remove('hidden');
        }
    });
}

// Obsługa przycisku wylogowania w panelu
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    // Ustawienie nazwy użytkownika z pamięci sesji
    document.getElementById('user-display').innerText = localStorage.getItem('qeoresearch_user') || 'Hank';

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('qeoresearch_auth');
        localStorage.removeItem('qeoresearch_user');
        window.location.href = 'login.html';
    });
}
