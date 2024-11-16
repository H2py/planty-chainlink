async function main() {
    const apiUrl = "https://your-server-url.com/plant-data";

    const response = await Functions.makeHttpRequest({
        url: apiUrl,
        method: "GET",
    });

    if (response.error) {
        throw Error("Error fetching data from API");
    }

    const data = response.data;
    const latestPlantData = data[data.length - 1];

    const humidity = latestPlantData.humidity;
    return Functions.encodeUint256(humidity);
}

return main();