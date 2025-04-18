const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 9876;
const WINDOW_SIZE = 10;
const TIMEOUT = 500; 

app.use(cors());
app.use(express.json());


const numberStores = {
    'p': { numbers: [], lastUpdated: null },
    'f': { numbers: [], lastUpdated: null },
    'e': { numbers: [], lastUpdated: null },
    'r': { numbers: [], lastUpdated: null }
};


const apiEndpoints = {
    'p': 'http://20.244.56.144/evaluation-service/primes',
    'f': 'http://20.244.56.144/evaluation-service/fibo',
    'e': 'http://20.244.56.144/evaluation-service/even',
    'r': 'http://20.244.56.144/evaluation-service/rand'
};


const calculateAverage = (numbers) => {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return parseFloat((sum / numbers.length).toFixed(2));
};


const updateNumberStore = (type, newNumbers) => {
    const store = numberStores[type];
    const prevState = [...store.numbers];
    
    
    newNumbers.forEach(num => {
        if (!store.numbers.includes(num)) {
            store.numbers.push(num);
        }
    });
    
    
    if (store.numbers.length > WINDOW_SIZE) {
        store.numbers = store.numbers.slice(-WINDOW_SIZE);
    }
    
    return {
        prevState,
        currState: [...store.numbers],
        avg: calculateAverage(store.numbers)
    };
};

app.get('/numbers/:type', async (req, res) => {
    const type = req.params.type;
    
    if (!['p', 'f', 'e', 'r'].includes(type)) {
        return res.status(400).json({ error: 'Invalid number type' });
    }

    try {
        const response = await axios.get(apiEndpoints[type], { timeout: TIMEOUT });
        const newNumbers = response.data.numbers;
        
        const result = updateNumberStore(type, newNumbers);
        
        res.json({
            windowPrevState: result.prevState,
            windowCurrState: result.currState,
            numbers: newNumbers,
            avg: result.avg
        });
    } catch (error) {
       
        const store = numberStores[type];
        res.json({
            windowPrevState: [...store.numbers],
            windowCurrState: [...store.numbers],
            numbers: [],
            avg: calculateAverage(store.numbers)
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});