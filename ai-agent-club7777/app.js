document.getElementById('helloBtn').addEventListener('click', async () => {
    try {
        const res = await fetch('/api/hello');
        const data = await res.json();
        document.getElementById('response').innerText = JSON.stringify(data, null, 2);
    } catch (err) {
        console.error(err);
        document.getElementById('response').innerText = 'حدث خطأ عند الاتصال بالـ API';
    }
});