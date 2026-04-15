export const searchNearbyRestaurants = async (keyword) => {
    // TODO: Include data file
    const {data} = [];
  
    if (!data) {
      let message = "We're sorry, but no results were found for ";
      message = message.concat(keyword);
      throw message;
    }
  
    return data;
  };

export const getRestaurantById = async (id) => {
    // TODO: Include data file
    const {data} = [];
  
    if (!data.meals || !Array.isArray(data.meals)) {
      throw 'No meal found with that id!';
    }
  
    return data;
  };
  