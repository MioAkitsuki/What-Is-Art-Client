<template>

  <v-container>
    <v-row class="intro" v-if="isDataFetched">
      <v-col :cols="1">
        <v-avatar :image=userInfo.profile_image_url :size="80"></v-avatar>
      </v-col>
      <v-col>
        <h1 class="text-h4 mb-4">
          {{ userInfo?.username != "" ? userInfo.username : "Guest" }}
        </h1>
        <h4 class="subheading">
          {{ userInfo?.bio != "" ? userInfo.bio : account.value }}
        </h4>
      </v-col>
      <v-col :cols="2" class="align-end">
        <v-progress-linear :model-value=proportion height="25" color="light-green" style="margin-bottom: 12px;" striped>
          <strong>{{ balance.value }} / {{ balance.maximum }}</strong>
        </v-progress-linear>
        <v-btn @click="mintFreeVote" variant="outlined">Mint a free vote</v-btn>
      </v-col>
    </v-row>

    <v-divider></v-divider>

    <v-data-iterator :items="userNft" :page="page" :items-per-page="4" v-if="isDataFetched">
        <template v-slot:default="{ items }">
          <v-row class="nft">
            <v-col cols="3" v-for="item in items">
              <v-card hover>
                <v-img :src="item.raw.media[0].gateway" :width="300" aspect-ratio="1/1"></v-img>
                <v-card-item>
                  <v-card-title>{{ item.raw.title }}</v-card-title>
                  <v-card-subtitle>{{ item.raw.description }}</v-card-subtitle>
                </v-card-item>
                <v-card-actions>
                  <v-btn @click="submitConfirm(item.raw)" variant="outlined">Nominate this NFT</v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
          
        </template>
        <template v-slot:footer="{ pageCount }">
          <v-pagination :length="pageCount" v-model="page"></v-pagination>
        </template>
    </v-data-iterator>
  </v-container>

  <v-dialog v-model="dialog.status" width="600">
    <v-card>
      <v-card-title>{{ dialog.title }}</v-card-title>
      <v-card-text>
        {{ dialog.content }}
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn @click="dialog.status = false"> Cancel </v-btn>
        <v-btn @click="submit(dialog.nft)"> Confirm </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.status" :color=snackbar.type timeout="3000">
    <v-alert :type=snackbar.type :title=snackbar.title :text=snackbar.content></v-alert>
  </v-snackbar>
  
</template>

<script>
  import { connected , contract , account, balance } from '@/App.vue'
  import Web3 from 'web3'
  import axios from 'axios'
  import { snackbar , overlay } from '@/layouts/default/AppBar.vue'

  export default {
    name: 'Account',
    data() {
      return {
        connected: connected,
        contract: contract,
        account: account,
        balance: balance,
        userInfo: [],
        userNft: [],
        dialog: {
          title: "",
          content: "",
          nft: undefined,
          status: false
        },
        snackbar: snackbar,
        overlay: overlay,
        isDataFetched: false,
        page: 1,
        proportion: 0,
      }
    },
    methods: {
      getUserInfo: async function () {
        this.overlay.callUp();
        if (connected.state) {
          const OPENSEA_API_KEY = "YOUR_OPENSEA_API_KEY";
          const ALCHEMY_API_KEY = "YOUR_ALCHEMY_API_KEY";

          let optionsOnOpensea = {
            method: 'GET',
            url: `https://api.opensea.io/api/v2/accounts/${account.value}`,
            headers: {
              accept: 'application/json',
              'x-api-key': OPENSEA_API_KEY
            }
          };

          await axios.request(optionsOnOpensea)
            .then(response => this.userInfo = response.data)
            .catch(err => console.log(err));

          let optionsOnAlchemy = {
            method: 'GET',
            url: `https://eth-sepolia.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTs`,
            params: {
              owner: `${account.value}`,
              withMetadata: 'true',
              pageSize: '100'
            },
            headers: {accept: 'application/json'}
          };

          await axios.request(optionsOnAlchemy)
            .then(response => {
              this.userNft = response.data.ownedNfts.filter(obj => obj.title != 'WIA' && obj.title != 'WIAT');
              
              this.isDataFetched = true;
            })
            .catch(err => console.log(err));
        }
        this.overlay.callDown();
      },
      submitConfirm: function (item) {
        this.dialog.title = "Nominate NFT"
        this.dialog.content = `Do you want to nominate ${item.title}? You cannot withdraw it until the whole voting progress ended.`;
        this.dialog.nft = item;

        this.dialog.status = true;
      },
      submit: function (item) {
        const abiOfERC721 = [
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "name_",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "symbol_",
                    "type": "string"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "approved",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "Approval",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "bool",
                    "name": "approved",
                    "type": "bool"
                }
            ],
            "name": "ApprovalForAll",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "getApproved",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                }
            ],
            "name": "isApprovedForAll",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "name",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "ownerOf",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "safeTransferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes",
                    "name": "_data",
                    "type": "bytes"
                }
            ],
            "name": "safeTransferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                },
                {
                    "internalType": "bool",
                    "name": "approved",
                    "type": "bool"
                }
            ],
            "name": "setApprovalForAll",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes4",
                    "name": "interfaceId",
                    "type": "bytes4"
                }
            ],
            "name": "supportsInterface",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "tokenURI",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
        ];
        let contractAddress = item.contract.address;

        let web3 = new Web3(window.ethereum);
        let c = new web3.eth.Contract(abiOfERC721, contractAddress);

        this.dialog.status = false;
        this.overlay.callUp();

        c.methods.safeTransferFrom(this.account.value, this.contract.address.toString(), item.id.tokenId)
          .send({ from: this.account.value.toString() })
          .then(res => {
            this.overlay.callDown();
            this.getUserInfo();

            this.snackbar.call("Success", "Successfully Nominated!", "success");
            this.checkBalance();
          })
          .catch(err => {
            let message = err.message;
            if (message.includes("User denied")) {
              this.snackbar.call("Error", "User denied the transaction.", "error");
            }

            this.overlay.callDown();
          });
      },
      checkBalance: async function() {
        this.balance.setMaximum(await this.contract.value?.methods.balanceOf(this.account.value, 1).call());
        this.balance.setValue(await this.contract.value?.methods.getVotesAvailable(this.account.value).call());
        this.proportion = Number(this.balance.value) / Number(this.balance.maximum) * 100;
      },
      mintFreeVote: async function () {
        this.overlay.callUp();

        if (await this.contract.value?.methods.isFreeVoteMinted(this.account.value).call()) {
          this.overlay.callDown();
          this.snackbar.call("Failed", "You have minted one free vote!", "error");

          return;
        }

        this.contract.value?.methods.mintFreeVote(this.account.value).send({ from: this.account.value })
          .then(() => {
            this.overlay.callDown();
            this.checkBalance();

            this.snackbar.call("Success", "Successfully Minted!", "success");
          })
          .catch(err => {
            let message = err.message;
            if (message.includes("User denied")) {
              this.snackbar.call("Error", "User denied the transaction.", "error");
            }

            this.overlay.callDown();
          });
      }
    },
    mounted() {
      if (this.userInfo.length == 0) {
        this.getUserInfo();
        this.checkBalance();
      }
    },
    watch: {
      'balance.value': function () {
        this.proportion = Number(this.balance.value) / Number(this.balance.maximum) * 100
      },
      'balance.maximum': function () {
        this.proportion = Number(this.balance.value) / Number(this.balance.maximum) * 100
      }
    }
  }
</script>

<style>
.intro {
  padding-top: 5%;
  padding-bottom: 5%;
}

.nft {
  padding-top: 3%;
  padding-bottom: 3%;
}
</style>