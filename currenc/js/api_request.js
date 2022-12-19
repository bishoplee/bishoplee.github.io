let myHeaders = new Headers();
myHeaders.append("apikey", "RiHI2Ov5V5apI7mYcsKutcMB3P0Ad3Im");

const requestOptions = {
	method: "GET",
	redirect: "follow",
	headers: myHeaders,
	cache: "default",
};

export default requestOptions;