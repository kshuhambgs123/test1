require("dotenv").config();

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

console.log(accountSid, authToken);

// // Copy code block
// // curl -X GET \
// // 'https://lookups.twilio.com/v2/PhoneNumbers/{PhoneNumber}' \
//   -u '<YOUR_ACCOUNT_SID>:<YOUR_AUTH_TOKEN>'
async function test(number){
    const headers = new Headers({
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`)
      });
    const response = await fetch(`https://lookups.twilio.com/v2/PhoneNumbers/${number}`,{
        method: "GET",
        headers: headers
    })

    const data = await response.json();
    console.log(data);
}

test("+919315612289")