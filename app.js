const regForm = document.getElementById('regForm');
const playerNickInput = document.getElementById('playerNick');
const slotsCount = document.getElementById('slotsCount');
const statusText = document.getElementById('statusText');
const approvedPlayersList = document.getElementById('approvedPlayersList'); // Новый элемент

const firebaseConfig = {
    apiKey: "AIzaSyBCiu3wo6o8CSZtbGxqXlLCFoQpRW3Z3aQ",
    authDomain: "pooker-40a93.firebaseapp.com",
    databaseURL: "https://pooker-40a93-default-rtdb.firebaseio.com",
    projectId: "pooker-40a93",
    storageBucket: "pooker-40a93.firebasestorage.app",
    messagingSenderId: "778144053208",
    appId: "1:778144053208:web:9a98608cef9032c07064ad",
    measurementId: "G-E03Q979Z6H"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const requestsRef = database.ref('requests');
const approvedRef = database.ref('approved');

// Функция для красивого всплывающего уведомления
function showToast(message, isError = false) {
    const oldToast = document.getElementById('custom-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'custom-toast';
    toast.textContent = message;
    
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: isError ? '#c62828' : '#2e7d32',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        zIndex: '10000',
        fontFamily: 'sans-serif',
        fontSize: '15px',
        fontWeight: 'bold',
        textAlign: 'center',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: '0',
        pointerEvents: 'none'
    });

    document.body.appendChild(toast);

    setTimeout(() => { toast.style.opacity = '1'; }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Живое обновление счетчика, статуса и списка игроков на главной
approvedRef.on('value', (snapshot) => {
    const data = snapshot.val();
    let totalPlayers = 0;
    
    // Очищаем список перед выводом
    approvedPlayersList.innerHTML = '';

    if (data) {
        totalPlayers = Object.keys(data).length;
        
        // Формируем красивый список ников
        let index = 1;
        let htmlContent = '';
        for (let id in data) {
            htmlContent += `<div><strong>${index}.</strong> ${data[id].nickname}</div>`;
            index++;
        }
        approvedPlayersList.innerHTML = htmlContent;
    } else {
        approvedPlayersList.innerHTML = '<div style="color: #888; text-align: center;">Участников пока нет</div>';
    }
    
    slotsCount.textContent = totalPlayers;

    if (totalPlayers >= 9) {
        statusText.textContent = "Набор закрыт";
        statusText.style.color = "red";
    } else {
        statusText.textContent = "Набор открыт";
        statusText.style.color = "";
    }
});

regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nick = playerNickInput.value.trim();
    if (!nick) return;

    approvedRef.once('value').then((appSnapshot) => {
        const appData = appSnapshot.val() || {};
        const approvedList = Object.values(appData);
        
        if (approvedList.length >= 9) {
            showToast('Извини, все места на ивент уже заняты!', true);
            return;
        }

        const isApproved = approvedList.some(p => p.nickname.toLowerCase() === nick.toLowerCase());
        if (isApproved) {
            showToast('Этот ник уже принят на ивент!', true);
            return;
        }

        requestsRef.once('value').then((reqSnapshot) => {
            const reqData = reqSnapshot.val() || {};
            const reqList = Object.values(reqData);
            
            const isRequested = reqList.some(p => p.nickname.toLowerCase() === nick.toLowerCase());
            if (isRequested) {
                showToast('Ты уже подал заявку, ожидай одобрения!', true);
                return;
            }

            requestsRef.push({
                nickname: nick,
                date: new Date().toLocaleString()
            }).then(() => {
                showToast('Заявка успешно отправлена на рассмотрение!');
                playerNickInput.value = '';
            });
        });
    });
});
