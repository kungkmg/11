const axios = require('axios');

axios.get('http://localhost:3001/api/users')
  .then(response => {
    if (response.status === 200) {
      console.log(response.data);
    } else if (response.status === 404) {
      throw new Error('Not found');
    } else {
      throw new Error('Something went wrong');
    }
  })
  .catch(error => {
    console.error('There was an error!', error.message);
  });


