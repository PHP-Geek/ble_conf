// This work is based on the example 'Read Characteristic Value Changed' 
// contributed by the Google Chrome Team at 
// https://googlechrome.github.io/samples/web-bluetooth/
// It has been modified by the Silicon Labs Apps Team to support an 
// application of Wi-Fi commissioning using Web BLE.
// It is made available as an example under the terms of the 
// Apache License, Version 2.0


// CustomScript 
var DEVICE_TYPE = '00'; // 00 is for Access Point | 01 is for IOT
const DEVICE_INFO_SERVICE = '0x180A';
const DEVICE_CAPABILITY_CHARACTERISTIC = '541e72cf-eb07-4b6e-943e-7228266eb94b'; // AP_STA_Supported


// Wi-Fi Scanner Service BLE GATT Services And Characteristic UUIDs
const SVC_WIFI_SCANNER_UUID             = 'fda1c2ce-2a2d-4bc9-ab90-2cd902c4f863';
const CHR_WIFI_SCANNER_STATE_UUID       = 'e96528a6-5dbd-43f2-bcd8-9edf4149ea95';

const CHR_WIFI_SCANNER_SSID_LIST_1_UUID = '18f34f5a-5271-46c2-9877-1dd100a3360c';
const CHR_WIFI_SCANNER_SSID_LIST_2_UUID = '9a67b351-8f29-448d-8333-fa1833b8c1ac';
const CHR_WIFI_SCANNER_SSID_LIST_3_UUID = '9e80440c-e064-460f-b151-8ef1feaee48e';
const CHR_WIFI_SCANNER_SSID_LIST_4_UUID = 'ebbce12b-dc4e-45c1-9dfe-e826632188d9';
const CHR_WIFI_SCANNER_SSID_LIST_5_UUID = '861ca448-414a-4b4d-9235-633b8b4ac19f';

// Wi-Fi Configurator Service BLE GATT Services And Characteristic UUIDs
// const SVC_WIFI_CONFIG_UUID              = '2b42aa3e-f916-4cf3-b1de-708824405ab3';
const SVC_WIFI_CONFIG_UUID             = 'f8574b28-7b66-4e48-859e-33235e5a5639';

const CHR_WIFI_CONFIG_STATE_UUID        = '9c17f034-d7cf-40a8-b854-0ee4871bea3b';
const CHR_WIFI_CONFIG_SSID_UUID         = '838fe068-0cfd-423a-ade3-ed8ca054fe60';
const CHR_WIFI_CONFIG_PASSWORD_UUID     = '69ae79aa-4d78-4347-b61b-7fefb7521fef';
const CHR_WIFI_CONFIG_SECURITY_UUID     = '322d5e60-b6cb-410f-a2c0-ac4a052459c6';
const CHR_WIFI_CONFIG_IS_CONFIG_AP_UUID     = '652c09bf-8ce7-45f5-bec8-a851d8cdf17b';
const CHR_WIFI_CONFIG_IS_RADIO_5G_UUID     = '7099bcfa-d4ff-40d9-8fcb-0bc3ed990d6b';


// Wi-Fi Scanner State Machine States
const WIFI_SCANNER_STATE_IDLE     = 0;
const WIFI_SCANNER_STATE_SCAN     = 1;
const WIFI_SCANNER_STATE_SCANNING = 2;
const WIFI_SCANNER_STATE_SCANNED  = 3;
const WIFI_SCANNER_STATE_ERROR    = 4;

// Wi-Fi Config State Machine States
const WIFI_CONFIG_STATE_IDLE      = 0;
const WIFI_CONFIG_STATE_SAVE      = 1;
const WIFI_CONFIG_STATE_SAVING    = 2;
const WIFI_CONFIG_STATE_SAVED     = 3;
const WIFI_CONFIG_STATE_JOIN      = 4;
const WIFI_CONFIG_STATE_JOINING   = 5;
const WIFI_CONFIG_STATE_JOINED    = 6;
const WIFI_CONFIG_STATE_ERROR    = 7;

const WIFI_SECURITY_WPA = 1;
const WIFI_SECURITY_WPA2 = 2;
const WIFI_SECURITY_WPA_WAP2 = 3;


const wifiConfigStateList = ["WIFI_CONFIG_STATE_IDLE", "WIFI_CONFIG_STATE_SAVE", "WIFI_CONFIG_STATE_SAVING", "WIFI_CONFIG_STATE_SAVED", "WIFI_CONFIG_STATE_JOIN", "WIFI_CONFIG_STATE_JOINING", "WIFI_CONFIG_STATE_JOINED", "WIFI_CONFIG_STATE_ERROR"];
const wifiScannerStateList = ["WIFI_SCANNER_STATE_IDLE", "WIFI_SCANNER_STATE_SCAN", "WIFI_SCANNER_STATE_SCANNING", "WIFI_SCANNER_STATE_SCANNED", "WIFI_SCANNER_STATE_ERROR"];

// Global Variables
var bluetoothDevice;
var wifiScannerStateCharacteristic;
var deviceInfoCharacteristic;
var wifiConfigStateCharacteristic;
var accessPointsObj = [];


// This function requests BLE devices nearby 
// with the device prefix name 'DMP'.
async function requestDevice() {
  log('> Requesting Bluetooth Devices DMP*...');
  let options = {};                                                             
  options.acceptAllDevices = true;
  // options.acceptAllDevices = true;
  options.optionalServices = [SVC_WIFI_SCANNER_UUID, SVC_WIFI_CONFIG_UUID];
  // optionalServices:['fda1c2ce-2a2d-4bc9-ab90-2cd902c4f863'];
  console.log('OPTIONS: ',options);
  bluetoothDevice = await navigator.bluetooth.requestDevice(options);           
  bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
}


// This function handles the event 'gattserverdisconnected'
async function onDisconnected() {
  log('> Bluetooth Device disconnected');
  try {
    await connectDeviceAndCacheCharacteristics()
  } catch (error) {
    log('> Error: ' + error);
  }
}


// This function connects the web browser to the BLE device and
// gets the Services and their corresponding Characteristics.
async function connectDeviceAndCacheCharacteristics() {
  if (bluetoothDevice.gatt.connected && 
      wifiScannerStateCharacteristic &&
      wifiConfigStateCharacteristic) {
    return;
  }

  log('> Connecting to GATT Server...');
  const server = await bluetoothDevice.gatt.connect();

  // const server = await bluetoothDevice.gatt.connect();
  // log('> CustomScript: Getting the Device Information Service...');
  // const deviceInfoService = await server.getPrimaryService(DEVICE_INFO_SERVICE);
  
  // log('> CustomScript: Getting the Device Information Characteristics...');
  // deviceInfoCharacteristic = await deviceInfoService.getCharacteristic(CHR_WIFI_SCANNER_STATE_UUID);
  
  // console.log('deviceInfoCharacteristic: ',deviceInfoCharacteristic);

  // log('> CustomScript: Getting the Device Information Service...');
  
  log('> Getting the Wi-Fi Scanner Service...');
  const wifiScannerService = await server.getPrimaryService(SVC_WIFI_SCANNER_UUID);

  log('> Getting the Wi-Fi Scanner Characteristics...');
  wifiScannerStateCharacteristic = await wifiScannerService.getCharacteristic(CHR_WIFI_SCANNER_STATE_UUID);
  wifiScannerStateCharacteristic.addEventListener('characteristicvaluechanged',
      handleWiFiScannerStateChanged);

  wifiScannerAP_List_1_Characteristic = await wifiScannerService.getCharacteristic(CHR_WIFI_SCANNER_SSID_LIST_1_UUID);
//  wifiScannerAP_List_1_Characteristic.addEventListener('characteristicvaluechanged',
//      handleWiFiScannerAccessPointList1Changed);

  wifiScannerAP_List_2_Characteristic = await wifiScannerService.getCharacteristic(CHR_WIFI_SCANNER_SSID_LIST_2_UUID);
//  wifiScannerAP_List_2_Characteristic.addEventListener('characteristicvaluechanged',
//      handleWiFiScannerAccessPointList2Changed);

  wifiScannerAP_List_3_Characteristic = await wifiScannerService.getCharacteristic(CHR_WIFI_SCANNER_SSID_LIST_3_UUID);
//  wifiScannerAP_List_3_Characteristic.addEventListener('characteristicvaluechanged',
//      handleWiFiScannerAccessPointList3Changed);

  wifiScannerAP_List_4_Characteristic = await wifiScannerService.getCharacteristic(CHR_WIFI_SCANNER_SSID_LIST_4_UUID);
//  wifiScannerAP_List_4_Characteristic.addEventListener('characteristicvaluechanged',
//      handleWiFiScannerAccessPointList4Changed);

  wifiScannerAP_List_5_Characteristic = await wifiScannerService.getCharacteristic(CHR_WIFI_SCANNER_SSID_LIST_5_UUID);
//  wifiScannerAP_List_5_Characteristic.addEventListener('characteristicvaluechanged',
//      handleWiFiScannerAccessPointList5Changed);

  log('> Getting the Wi-Fi Configurator Service...');
  const wifiConfigService = await server.getPrimaryService(SVC_WIFI_CONFIG_UUID);

  log('> Getting the Wi-Fi Configurator Characteristics...');
  wifiConfigStateCharacteristic = await wifiConfigService.getCharacteristic(CHR_WIFI_CONFIG_STATE_UUID);
  wifiConfigStateCharacteristic.addEventListener('characteristicvaluechanged',
      handleWiFiConfigStateChanged);

  wifiConfigSSIDCharacteristic = await wifiConfigService.getCharacteristic(CHR_WIFI_CONFIG_SSID_UUID);
  wifiConfigPasswordCharacteristic = await wifiConfigService.getCharacteristic(CHR_WIFI_CONFIG_PASSWORD_UUID);
  wifiConfigSecurityCharacteristic = await wifiConfigService.getCharacteristic(CHR_WIFI_CONFIG_SECURITY_UUID);
  wifiConfigIsAPConfigCharacteristic = await wifiConfigService.getCharacteristic(CHR_WIFI_CONFIG_IS_CONFIG_AP_UUID);
  wifiConfigCapabilityCharacteristic = await wifiConfigService.getCharacteristic(DEVICE_CAPABILITY_CHARACTERISTIC);

   wifiConfigIsRadio5GCharacteristic = await wifiConfigService.getCharacteristic(CHR_WIFI_CONFIG_IS_RADIO_5G_UUID);

  // let ssid = await wifiConfigSSIDCharacteristic.readValue();
  // var enc = new TextDecoder("utf-8"); 
  // console.log('Old SSID: ',enc.decode(ssid));
}

async function viewUI(){
      //get the capability value for configuration 
    log('> get device capability characteristics');
    let capability = await wifiConfigCapabilityCharacteristic.readValue();
    var enc = new TextDecoder("utf-8");
    capability = enc.decode(capability);
    log('> capability found - '+capability);
    //check if capability is IOT or extender device then enable the find access point button
    if(capability == 'IOT'){
        document.querySelector("#btnScan").disabled = false;
        document.getElementById("btnScan").style.display = 'table-row';
    } else if(capability == 'EXTENDER'){
        document.querySelector(".ap_sta_options").style.display = 'table-row';        
        document.querySelector('#ap_sta_1').disabled=false;
        document.querySelector('#ap_sta_2').disabled=false;
        document.querySelector('#ap_sta_1').checked=true;
        var elements = document.getElementsByClassName('ap_device_options');
        for (var i = 0; i < elements.length; i++){
          elements[i].style.display = 'table-row';
        }
    } else {
        var elements = document.getElementsByClassName('ap_device_options');
        for (var i = 0; i < elements.length; i++){
          elements[i].style.display = 'table-row';
        }
    }
}

// This function will be called when 'readValue' resolves and the
// characteristic value changes since 'characteristicvaluechanged' event
// listener has been added. 
function handleWiFiScannerStateChanged(event) {
  console.log('wifiScannerState: ',event);
  let wifiScannerState = event.target.value.getUint8(0);
  log('> Wi-Fi Scanner State is ' + wifiScannerState);
  document.getElementById('iot_state').value = wifiScannerStateList[wifiScannerState];
  // wifiScannerState = wifiScannerState - 48;
  // wifiScannerState = 0;
  console.log('wifiScannerState: ',wifiScannerState);
  switch (wifiScannerState) {
    case WIFI_SCANNER_STATE_IDLE:
      console.log('ok..');
      document.querySelector('#btnConnect').disabled = true;
      document.querySelector('#btnScan').disabled = false;
      document.querySelector('#btnReset').disabled = false;
      break;

    case WIFI_SCANNER_STATE_SCANNED:
//      readWiFiScannerResults();
      setIOTDeviceOptions();
      document.querySelector('#btnConnect').disabled = true;
      document.querySelector('#btnScan').disabled = false;
      document.querySelector('#btnReset').disabled = false;
      document.querySelector('#btnSave').disabled = false;
      document.querySelector('#btnJoin').disabled = false;
      document.querySelector('#selAccessPoint').disabled = false;
      document.querySelector('#txtPassword').disabled = false;      
      document.querySelector('#ap_sta_1').disabled=false;
      document.querySelector('#ap_sta_2').disabled=false;
      break;

    case WIFI_SCANNER_STATE_ERROR:
      document.querySelector('#btnConnect').disabled = true;
      document.querySelector('#btnScan').disabled = false;
      document.querySelector('#btnReset').disabled = false;
      break;
    

  }
}
// This function will be called when 'readValue' resolves and the
// characteristic value changes since 'characteristicvaluechanged' event
// listener has been added. 
function handleWiFiConfigStateChanged(event) {

  console.log('handleWiFiConfigStateChanged EVENT..');
  let wifiConfigState = event.target.value.getUint8(0);
  log('> Wi-Fi Config State is ' + wifiConfigState);
  document.getElementById('ap_status').value = wifiConfigStateList[wifiConfigState];
  
  // $('#ap_status').val(wifiConfigStateList[]);

  switch (wifiConfigState) {
    case WIFI_CONFIG_STATE_IDLE:
      document.querySelector('#btnConnect').disabled = true;
      document.querySelector('#btnScan').disabled = false;
      document.querySelector('#btnReset').disabled = false;
      document.getElementById('saveAPSettings').disabled = false;
      break;

    case WIFI_CONFIG_STATE_SAVED:
      savedEventHandler();
      document.querySelector('#btnConnect').disabled = true;
      document.querySelector('#btnScan').disabled = false;
      document.querySelector('#btnReset').disabled = false;
      document.querySelector('#btnSave').disabled = false;
      document.querySelector('#btnJoin').disabled = false;
      document.querySelector('#selAccessPoint').disabled = false;
      document.querySelector('#txtPassword').disabled = false;
      document.getElementById('saveAPSettings').disabled = false;
      break;

    case WIFI_CONFIG_STATE_JOINED:
      joinedEventHandler();
      document.querySelector('#btnConnect').disabled = true;
      document.querySelector('#btnScan').disabled = false;
      document.querySelector('#btnReset').disabled = false;
      document.querySelector('#btnSave').disabled = false;
      document.querySelector('#btnJoin').disabled = false;
      document.querySelector('#selAccessPoint').disabled = false;
      document.querySelector('#txtPassword').disabled = false;
      document.getElementById('saveAPSettings').disabled = true;
      break;

    case WIFI_CONFIG_STATE_ERROR:
      document.querySelector('#btnConnect').disabled = true;
      document.querySelector('#btnScan').disabled = false;
      document.querySelector('#btnReset').disabled = false;
      document.querySelector('#btnSave').disabled = false;
      document.querySelector('#btnJoin').disabled = false;
      document.querySelector('#selAccessPoint').disabled = false;
      document.querySelector('#txtPassword').disabled = false;
      document.getElementById('saveAPSettings').disabled = true;
      break;
    default: 
      document.getElementById('saveAPSettings').disabled = true;
  }
}


// The following callback functions will be called when 'readValue'
// resolves and the characteristic value changes since the 
// 'characteristicvaluechanged' event listener has been added. 
function handleWiFiScannerAccessPointList1Changed(event) {
  parseJsonAccessPoints(event);
}

function handleWiFiScannerAccessPointList2Changed(event) {
  parseJsonAccessPoints(event);
}

function handleWiFiScannerAccessPointList3Changed(event) {
  parseJsonAccessPoints(event);
}

function handleWiFiScannerAccessPointList4Changed(event) {
  parseJsonAccessPoints(event);
}

function handleWiFiScannerAccessPointList5Changed(event) {
  parseJsonAccessPoints(event);
}


// This function reads the Wi-Fi scanner results,
// prevents any further notifications and resets 
// the scanner service to the idle state. 
async function readWiFiScannerResults() {
  console.log('readWiFiScannerResults..');
  try {
    console.log('readWiFiScannerResults..');
    if (!bluetoothDevice) {
      await requestDevice();
    }
    await connectDeviceAndCacheCharacteristics();

    log('> Reading Wi-Fi Scanner Results...');

    await wifiScannerAP_List_1_Characteristic.readValue();
    await wifiScannerAP_List_2_Characteristic.readValue();
    await wifiScannerAP_List_3_Characteristic.readValue();
    await wifiScannerAP_List_4_Characteristic.readValue();
    await wifiScannerAP_List_5_Characteristic.readValue();

    log('> Stop Wi-Fi Scanner State Notifications...');
    await wifiScannerStateCharacteristic.stopNotifications();

    // Reset the Wi-Fi scanner state back to idle
    var wifiScannerState = Uint8Array.of(WIFI_SCANNER_STATE_IDLE);
    await wifiScannerStateCharacteristic.writeValue(wifiScannerState);

    // Read the Wi-Fi scanner state to confirm
    await wifiScannerStateCharacteristic.readValue();

  } catch (error) {
    log('> Error: ' + error);
  }
}


async function savedEventHandler() {
  log('> Saved.');
  log('> Stop Wi-Fi Config State Notifications...');
  await wifiConfigStateCharacteristic.stopNotifications();

  // Reset the Wi-Fi config state back to idle
  var wifiConfigState = Uint8Array.of(WIFI_CONFIG_STATE_IDLE);
  await wifiConfigStateCharacteristic.writeValue(wifiConfigState);

  // Read the Wi-Fi config state to confirm
  await wifiConfigStateCharacteristic.readValue();
}


async function joinedEventHandler() {
  log('> Joined.');
  log('> Stop Wi-Fi Config State Notifications...');
  await wifiConfigStateCharacteristic.stopNotifications();

  // Reset the Wi-Fi config state back to idle
  var wifiConfigState = Uint8Array.of(WIFI_CONFIG_STATE_IDLE);
  await wifiConfigStateCharacteristic.writeValue(wifiConfigState);

  // Read the Wi-Fi config state to confirm
  await wifiConfigStateCharacteristic.readValue();
}

// This helper function converts an array buffer type to a string.
// It is used to convert the data received from the BLE device into
// a JSON string representation of the access points list.
function arrayBufferToString(buffer){
  var arr = new Uint8Array(buffer);
  var str = String.fromCharCode.apply(String, arr);
  if(/[\u0080-\uffff]/.test(str)){
      log('> Error: This string seems to contain (still encoded) multibytes');
  }
  return str;
}


// This function parses the array buffer with the JSON representation
// of the Access Points list into a JavaScript object.
// Once it is in a JavaScript object the list of Access Points are sorted
// by the signal strength and the HTML drop-down is populated.
function parseJsonAccessPoints(event) {

  var str = arrayBufferToString(event.target.value.buffer);

  if (str.length > 18) {
    try {
      var obj = JSON.parse(str);
      if (obj.ap.length > 0) {
        accessPointsObj = accessPointsObj.concat(obj.ap);
        accessPointsObj.sort((a, b) => (Number(a.rcpi) < Number(b.rcpi)) ? 1 : -1);
        var x = document.getElementById("selAccessPoint");
        while (x.firstChild) {
          x.removeChild(x.firstChild);
        }
        for (i = 0; i < accessPointsObj.length; i++) {
          var option = document.createElement("option");
          option.text = accessPointsObj[i].ssid;
          option.value = accessPointsObj[i].rcpi;
          x.add(option);
        }
        // Enable to display the JSON payload for debugging
        // log(JSON.stringify(accessPointsObj, null, 2));
      }
    } catch (e) {
      log('> Error: ' + e.name + ': ' + e.message);
    }
  }
}


// This function clears the list of Access Points
function removeAllAccessPoints() {
  var x = document.getElementById("selAccessPoint");
  while (x.firstChild) {
    x.removeChild(x.firstChild);
  }
  accessPointsObj = [];
}


// This function handles the click event of the button 'Connect'.
async function onConnectButtonClick() {
  try {
    if (!bluetoothDevice) {
      await requestDevice();
    }
    await connectDeviceAndCacheCharacteristics();
    await viewUI();

    log('> Reading Wi-Fi Configururation service State...');
    await wifiScannerStateCharacteristic.readValue();
    await wifiConfigStateCharacteristic.readValue();
  } catch (error) {
    log('> Error: ' + error);
  }
}


// This function handles the click event of the button 'Reset Device'.
function onResetButtonClick() {
  // Disable/Enable the buttons
  document.querySelector('#btnConnect').disabled = false;
  document.querySelector('#btnScan').disabled = true;
  document.querySelector('#btnReset').disabled = true;
  document.querySelector('#btnSave').disabled = true;
  document.querySelector('#btnJoin').disabled = true;
  document.querySelector('#selAccessPoint').disabled = true;
  document.querySelector('#txtPassword').disabled = true;

  removeAllAccessPoints();

  if (wifiScannerStateCharacteristic) {
    wifiScannerStateCharacteristic.removeEventListener('characteristicvaluechanged',
        handleWiFiScannerStateChanged);
        wifiScannerStateCharacteristic = null;
  }
  // Note that it doesn't disconnect device.
  bluetoothDevice = null;
  log('> Bluetooth Device reset');
}


// This function handles the click event of the button 'Start Scan'.
async function onScanButtonClick() {
  try {
    if (!bluetoothDevice) {
      await requestDevice();
    }
    await connectDeviceAndCacheCharacteristics();

    log('> Starting a Wi-Fi Scan...');

    document.querySelector('#btnScan').disabled = true;
    document.querySelector('#btnSave').disabled = true;
    document.querySelector('#btnJoin').disabled = true;
    removeAllAccessPoints();
    document.querySelector('#selAccessPoint').disabled = true;
    document.querySelector('#txtPassword').disabled = true;
    document.querySelector('#ap_sta_1').disabled=true;
    document.querySelector('#ap_sta_2').disabled=true;

    log('> Starting Wi-Fi Scanner State Notifications...');
    await wifiScannerStateCharacteristic.startNotifications();

    log('> Writing Wi-Fi Scanner State...');
    var wifiScannerState = Uint8Array.of(WIFI_SCANNER_STATE_SCAN);
    console.log('wifiScannerState-New: ',wifiScannerState);
//     let wifiScannerStateVal = wifiScannerState.getUint8(0);
//     console.log('wifiScannerState-New: ',wifiScannerStateVal);
    await wifiScannerStateCharacteristic.writeValue(wifiScannerState);
    console.log('wifiScannerStateCharacteristic.writeValue -- complete - part-1');
//     setIOTDeviceOptions();
    
    
  } catch (error) {
    log('> Error: ' + error);
  }
}


// This function handles the click event of the button 'Save Access Point'.
async function onSaveButtonClick() {
  try {
    if (!bluetoothDevice) {
      await requestDevice();
    }
    await connectDeviceAndCacheCharacteristics();

    log('> Saving Access Point...');

    document.querySelector('#btnScan').disabled = true;
    document.querySelector('#btnSave').disabled = true;
    document.querySelector('#btnJoin').disabled = true;
    document.querySelector('#selAccessPoint').disabled = true;
    document.querySelector('#txtPassword').disabled = true;
    
    log('> Saving configuratio info');
    let SSID = document.getElementById('iot_ssid').value;
    let pass_phrase = document.getElementById('iot_passphrase').value;
    let radio = document.getElementById('iot_radio').value;
    let rcpi = document.getElementById('iot_rcpi').value;
    let sec = document.getElementById('iot_sec').value;
    let is_ap_config = document.getElementById('iot_is_config_ap').value;
    let is_radio5g = document.getElementById('iot_is_radio_5g').value;
    console.log('>radio 5g set to : '+is_radio5g+' is ap config '+is_ap_config);

    let state = document.getElementById('iot_state').value;

    log('> Starting Wi-Fi Config State Notifications...');
    await wifiConfigStateCharacteristic.startNotifications();
    
    var enc = new TextEncoder(); 
    await wifiConfigSSIDCharacteristic.writeValue(enc.encode(SSID));
    await wifiConfigPasswordCharacteristic.writeValue(enc.encode(pass_phrase));
    await wifiConfigSecurityCharacteristic.writeValue(Uint8Array.of(sec));
    await wifiConfigIsAPConfigCharacteristic.writeValue(Uint8Array.of(is_ap_config));
    await wifiConfigIsRadio5GCharacteristic.writeValue(Uint8Array.of(is_radio5g));
    await wifiConfigStateCharacteristic.writeValue(Uint8Array.of(state));
    
//    log('> Writing Wi-Fi Config State...');
//    var wifiConfigState = Uint8Array.of(WIFI_CONFIG_STATE_SAVE);
//    await wifiConfigStateCharacteristic.writeValue(wifiConfigState);



  } catch (error) {
    log('> Error: ' + error);
  }
}


// This function handles the click event of the button 'Join Access Point'.
async function onJoinButtonClick() {
  try {
    if (!bluetoothDevice) {
      await requestDevice();
    }
    await connectDeviceAndCacheCharacteristics();

    log('> Joining Access Point...');

    document.querySelector('#btnScan').disabled = true;
    document.querySelector('#btnSave').disabled = true;
    document.querySelector('#btnJoin').disabled = true;
    document.querySelector('#selAccessPoint').disabled = true;
    document.querySelector('#txtPassword').disabled = true;

    log('> Starting Wi-Fi Config State Notifications...');
    await wifiConfigStateCharacteristic.startNotifications();

    log('> Writing Wi-Fi Config State...');
    var wifiConfigState = Uint8Array.of(WIFI_CONFIG_STATE_JOIN);
    await wifiConfigStateCharacteristic.writeValue(wifiConfigState);

  } catch (error) {
    log('> Error: ' + error);
  }
}

// CustomScript

// async function onAPSettingsChange() {
//   let check_state = await wifiConfigSSIDCharacteristic.readValue();
//   console.log('check_state: ',check_state.getUint8(0));
//   document.getElementById('ap_ssid').value = ap_state;

//   let SSID = document.getElementById('ap_ssid').value;
//   let pass_phrase = document.getElementById('ap_passphrase').value;
//   let security = document.getElementById('ap_security').value;

//   if (SSID !== "" && pass_phrase !== "" && security !== "") {
//     document.getElementById('ap_state').value = 1;
//   }
// }

async function onAPSettingsButtonClick() {
  // let check_state = await wifiConfigSSIDCharacteristic.readValue();
  // console.log('check_state: ',check_state.getUint8(0));
  // document.getElementById('ap_ssid').value = ap_state;

  let SSID = document.getElementById('ap_ssid').value;
  let pass_phrase = document.getElementById('ap_passphrase').value;
  let security = document.getElementById('ap_security').value;
  let is_ap_config = document.getElementById('ap_is_config_ap').value;

  // if (SSID !== "" && pass_phrase !== "" && security !== "") {
  //   document.getElementById('ap_state').value = 1;
  // }

  let state = document.getElementById('ap_state').value;
  // var wifiConfigState = Uint8Array.of(WIFI_CONFIG_STATE_IDLE);
  // Uint8Array.of(

  log('> Setting access-point configuration - SSID, Passphrase, Security -- Starting Notifications');
  await wifiConfigStateCharacteristic.startNotifications();

  log('> Setting access-point configuration - SSID, Passphrase, Security.');
  var enc = new TextEncoder(); 
  await wifiConfigSSIDCharacteristic.writeValue(enc.encode(SSID));
  await wifiConfigPasswordCharacteristic.writeValue(enc.encode(pass_phrase));
  await wifiConfigSecurityCharacteristic.writeValue(Uint8Array.of(security));
  await wifiConfigIsAPConfigCharacteristic.writeValue(Uint8Array.of(is_ap_config));
  await wifiConfigStateCharacteristic.writeValue(Uint8Array.of(state));
  
  // await wifiConfigSSIDCharacteristic.writeValue(SSID);
  // await wifiConfigStateCharacteristic.writeValue(security);
  
  // console.log('SSID: ',SSID);
}


async function setIOTDeviceOptions() {
  console.log('setIOTDeviceOptions');
//   wifiConfigSSIDCharacteristic = await wifiConfigService.getCharacteristic(CHR_WIFI_CONFIG_SSID_UUID);
   log('> Configuring IOT Device - Get SSID List.');
   

   let SSID_1 = await wifiScannerAP_List_1_Characteristic.readValue();
   let SSID_2 = await wifiScannerAP_List_2_Characteristic.readValue();
   let SSID_3 = await wifiScannerAP_List_3_Characteristic.readValue();
   let SSID_4 = await wifiScannerAP_List_4_Characteristic.readValue();
   let SSID_5 = await wifiScannerAP_List_5_Characteristic.readValue();
   var enc = new TextDecoder("utf-8");
   log('> get wifiscanner ap characteristics');
   console.log('SSID_1: ', enc.decode(SSID_1.buffer));
   console.log('SSID_2: ', enc.decode(SSID_2.buffer));
   console.log('SSID_3: ', enc.decode(SSID_3.buffer));
   console.log('SSID_4: ', enc.decode(SSID_4.buffer));
   console.log('SSID_5: ', enc.decode(SSID_5.buffer));
   let ssid_obj1 = enc.decode(SSID_1.buffer)
   let ssid_obj2 = enc.decode(SSID_2.buffer)
   let ssid_obj3 = enc.decode(SSID_3.buffer)
   let ssid_obj4 = enc.decode(SSID_4.buffer)
   let ssid_obj5 = enc.decode(SSID_5.buffer)
   let ssid_all = ssid_obj1 + ssid_obj2 + ssid_obj3 + ssid_obj4 + ssid_obj5;
//   let ssid_obj4 = await concatenate(Uint8Array.of(SSID_1),SSID_2,SSID_3,SSID_4,SSID_5);
//   let ssid_all = '[{"radio": "0", "ssid": "Rashmi-5G-Guest", "rcpi": -77, "security": ""}, {"radio": "1", "ssid": "Rashmi-5G", "rcpi": -77, "security": ""}, {"radio": "1", "ssid": "dlink-345F", "rcpi": -81, "security": ""}, {"radio": "1", "ssid": "", "rcpi": -79, "security": ""}, {"radio": "0", "ssid": "Tech_D0017388", "rcpi": -81, "security": ""}, {"radio": "0", "ssid": "EasyMesh-tst-bbss", "rcpi": -74, "security": ""}, {"radio": "0", "ssid": "EasyMesh-tst-fbss", "rcpi": -74, "security": ""}, {"radio": "1", "ssid": "iotina_2.4", "rcpi": -86, "security": ""}, {"radio": "1", "ssid": "TMOBILE-BF93_5G", "rcpi": -91, "security": ""}, {"radio": "0", "ssid": "EasyMesh-tst-bbss", "rcpi": -60, "security": ""}, {"radio": "1", "ssid": "EasyMesh-tst-fbss", "rcpi": -60, "security": ""}, {"radio": "1", "ssid": "MySpectrumWiFiDE-5G", "rcpi": -74, "security": ""}, {"radio": "0", "ssid": "iotina_5G", "rcpi": -65, "security": ""}, {"radio": "1", "ssid": "", "rcpi": -60, "security": ""}, {"radio": "1", "ssid": "dlink-345F", "rcpi": -60, "security": ""}, {"radio": "0", "ssid": "", "rcpi": -84, "security": ""}, {"radio": "0", "ssid": "dlink-345F", "rcpi": -60, "security": ""}, {"radio": "1", "ssid": "dlink-345F", "rcpi": -84, "security": ""}, {"radio": "0", "ssid": "", "rcpi": -60, "security": ""}]';
    console.log('decoded string is '+ ssid_all);
    let ssid_obj = JSON.parse(ssid_all);
  document.getElementById('iot_ssid').innerHTML = '<option value="">Select Access Point</option>';
  var iot_ssid_list = document.getElementById('iot_ssid');
  let ssid_list = [];
  for (var i=0; i<ssid_obj.length; i++) {
//    if (!ssid_list.hasOwnProperty(ssid_obj[i].ssid)) {
    var radio_str = "";
    if (ssid_obj[i].radio == "1") {
      radio_str = "2.4 Ghz";
    } else if(ssid_obj[i].radio == "0") {
      radio_str = "5 Ghz";
    }
      let ssid_single_obj = {
        ssid: ssid_obj[i].ssid,
        radio: ssid_obj[i].radio,
        rcpi: ssid_obj[i].rcpi,
        sec: ssid_obj[i].security,
      }
      ssid_list[ssid_obj[i].ssid] = ssid_single_obj;

      var opt = document.createElement('option');
      opt.setAttribute('data-value',JSON.stringify(ssid_obj[i]));
      opt.value = ssid_obj[i].ssid;
      opt.innerHTML = ssid_obj[i].ssid + " " + ssid_obj[i].rcpi + " " + radio_str;
      iot_ssid_list.appendChild(opt);
//    } 
  }
  await viewIOTOptions();

  console.log('ssid_list: ',ssid_list);

}

/**
 * view IOT options
 * @returns {undefined}
 */
async function viewIOTOptions(){
    var elements = document.getElementsByClassName('iot_device_options');
    for (var i = 0; i < elements.length; i++){
      elements[i].style.display = 'table-row';
    }
    document.getElementById('iot_passphrase').value = "";
}


