// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'
import { default as CryptoJS } from 'crypto-js'
var accounts;
var account;
var foodSafeABI;
var foodSafeContract;
var foodSafeCode;
window.App = {
  start: function() {
    var self = this;
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];
      web3.eth.defaultAccount = account;
      var foodSafeSource = "pragma solidity ^0.4.6; contract FoodSafe {    struct Location    {        string Name;        uint LocationId;        uint PreviousLocationId;        uint Timestamp;        string Secret;    }    mapping(uint => Location) Trail;    uint8 TrailCount = 0;    function AddNewLocation(uint LocationId, string Name, string Secret){        Location memory newLocation;        newLocation.Name = Name;        newLocation.LocationId = LocationId;        newLocation.Secret = Secret;        newLocation.Timestamp = now;        if(TrailCount != 0)        {            newLocation.PreviousLocationId= Trail[TrailCount].LocationId;        }        Trail[TrailCount] = newLocation;        TrailCount++;    }    function GetTrailCount() returns(uint8){        return TrailCount;    }    function GetLocation(uint TrailNo) returns (string, uint, uint, uint, string){        return(Trail[TrailNo].Name, Trail[TrailNo].LocationId, Trail[TrailNo].PreviousLocationId, Trail[TrailNo].Timestamp, Trail[TrailNo].Secret);    }}";
      web3.eth.compile.solidity(foodSafeSource, function(error, foodSafeCompiled){
        console.log(error);
        console.log(foodSafeCompiled);
        foodSafeABI = foodSafeCompiled['<stdin>:FoodSafe'].info.abiDefinition;
        foodSafeContract = web3.eth.contract(foodSafeABI);
        foodSafeCode = foodSafeCompiled['<stdin>:FoodSafe'].code;
      });
    });
  },

  createContract: function(){
    foodSafeContract.new("",{from:account, data:foodSafeCode, gas:30000000}, function(error, deployedContract) {
      if(deployedContract.address)
      {
        document.getElementById("contractAddress").value=deployedContract.address;
      }
    });
  },

  addNewLocation: function(){
    var contractAddress = document.getElementById("contractAddress").value;
    var deployedFoodSafe = foodSafeContract.at(contractAddress);
    var locationId = document.getElementById("locationId").value;
    var locationName = document.getElementById("locationName").value;
    var locationSecret = document.getElementById("locationSecret").value;
    var passPhrase = document.getElementById("passPhrase").value;
    var encryptedSecret = CryptoJS.AES.encrypt(locationSecret, passPhrase).toString();
    deployedFoodSafe.addNewLocation(locationId, locationName, encryptedSecret, function(error){
      console.log(error);
    })
  },
  getCurrentLocation: function(){
    var contractAddress = document.getElementById("contractAddress").value;
    var deployedFoodSafe = foodSafeContract.at(contractAddress);
    var passPhrase = document.getElementById("passPhrase").value;
    var encryptedSecret = CryptoJS.AES.encrypt(locationSecret, passPhrase).toString();
    deployedFoodSafe.GetTrailCount.call(function(error, trailCount){
      deployedFoodSafe.GetLocation.call(trailCount-1, function(error, returnValues){
        document.getElementById("locationId").value = returnValues[1];
        document.getElementById("locationName").value = returnValues[0];
        var encryptedSecret = returnValues[4];
        var decryptedSecret = CryptoJS.AES.decrypt(encryptedSecret, passPhrase).toString(CryptoJS.eth.Utf8);
        document.getElementById("secret").value = decryptedSecret;
      })
    })
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  App.start();
});
