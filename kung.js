const kung = document.getElementById('kungData');

async function fetchKungData(id) {
    try {
        const response = await fetch(`/api/kung/${id}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


async function displayKungData() {
    const id = 'your_id_here';
    const kungData = await fetchKungData(id);
    document.getElementById('kung').innerHTML = JSON.stringify(kungData, null, 2); 
}

displayKungData();
