const firebaseConfig = {
    apiKey: "AIzaSyBCiu3wo6o8CSZtbGxqXlLCFoQpRW3Z3aQ",
    databaseURL: "https://pooker-40a93-default-rtdb.firebaseio.com",
    projectId: "pooker-40a93"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();
const requestsRef = database.ref('server2_requests');
const approvedRef = database.ref('server2_approved');

const modal = document.getElementById('rulesModal');
const openBtn = document.getElementById('openRulesBtn');
const closeBtn = document.getElementById('closeRulesBtn');

if (openBtn && modal) {
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
    });
}

if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

function showToast(message, isError = false) {
    const oldToast = document.getElementById('main-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'main-toast';
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#7A2B2D' : '#2C3E2B';
    toast.style.color = isError ? '#ff8888' : '#00d100';
    
    document.body.appendChild(toast);

    setTimeout(() => { 
        if (toast) toast.remove(); 
    }, 2500);
}

approvedRef.on('value', (snapshot) => {
    const data = snapshot.val();
    const listDiv = document.getElementById('approvedPlayersList');
    const countSpan = document.getElementById('slotsCount');
    const statusSpan = document.getElementById('eventStatus');

    if (!listDiv) return;
    listDiv.innerHTML = '';
    
    if (!data) {
        if (countSpan) countSpan.textContent = '0';
        if (statusSpan) {
            statusSpan.textContent = 'Набор открыт';
            statusSpan.className = 'van';
        }
        listDiv.innerHTML = '<span class="fri">Участников пока нет</span>';
        return;
    }
    
    const total = Object.keys(data).length;
    if (countSpan) countSpan.textContent = total;
    
    if (statusSpan) {
        if (total >= 9) {
            statusSpan.textContent = 'Набор закрыт';
            statusSpan.style.color = '#7A2B2D';
        } else {
            statusSpan.textContent = 'Набор открыт';
            statusSpan.className = 'van';
        }
    }
    
    let index = 1;
    for (let id in data) {
        if (data[id] && data[id].nickname) {
            listDiv.innerHTML += `<div><b>${index}.</b> ${data[id].nickname}</div>`;
            index++;
        }
    }
}, (error) => {
    console.error("Ошибка чтения approvedRef:", error);
});

const regForm = document.getElementById('regForm');
if (regForm) {
    regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nickInput = document.getElementById('nickInput');
        if (!nickInput) return;
        
        const nick = nickInput.value.trim();
        if (!nick) return;

        approvedRef.once('value').then((appSnap) => {
            const approved = appSnap.val() || {};
            
            if (Object.keys(approved).length >= 9) {
                showToast('Извините, мест больше нет!', true);
                return;
            }

            requestsRef.once('value').then((reqSnap) => {
                const pending = reqSnap.val() || {};
                
                const isNickTaken = Object.values(approved).some(p => p && p.nickname && p.nickname.toLowerCase() === nick.toLowerCase()) ||
                                    Object.values(pending).some(p => p && p.nickname && p.nickname.toLowerCase() === nick.toLowerCase());

                if (isNickTaken) {
                    showToast('Этот ник уже подал заявку!', true);
                    return;
                }

                requestsRef.push({ 
                    nickname: nick, 
                    date: new Date().toISOString() 
                }).then(() => {
                    showToast('Заявка успешно отправлена!');
                    nickInput.value = '';
                }).catch((err) => {
                    showToast('Ошибка записи: ' + err.message, true);
                });
            }).catch((err) => {
                showToast('Ошибка запроса заявок', true);
                console.error(err);
            });
        }).catch((err) => {
            showToast('Ошибка запроса участников', true);
            console.error(err);
        });
    });
}
