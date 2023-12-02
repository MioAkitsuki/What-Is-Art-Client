<template>
  
  <v-container class="fill-height">
    <v-row class="market-intro">
      <v-col :cols="8">
        <h1 class="text-h2">Market</h1>
        <p class="text-h5 font-weight-light text-medium-emphasis">Vote for your definition of ART.</p>
      </v-col>
      <v-col :cols="4" class="align-end">
        <v-progress-linear :model-value=proportion height="25" color="light-green" style="margin-bottom: 12px;" striped>
          <strong>{{ balance.value ?? 'N' }} / {{ balance.maximum ?? 'A' }}</strong>
        </v-progress-linear>
        <div class="d-flex justify-space-between">
          <v-btn variant="outlined" @click="route.set('donate')">Get More Vote</v-btn>
          <v-btn variant="outlined" @click="toAccountConfirm">Nominate your ART</v-btn>
        </div>
      </v-col>
    </v-row>

    <v-divider></v-divider>

    <v-data-iterator :items="allNft" :page="page" :items-per-page="4" v-if="isDataFetched" style="width: 100%;">
      <template v-slot:default="{ items }">
        <v-row class="nft">
          <v-col :cols="3" v-for="item in items">
            <v-card hover>
              <v-img :src="item.raw.media[0].gateway" :width="300" aspect-ratio="1/1">
                <v-toolbar color="rgba(0, 0, 0, 0)">
                  <template v-slot:append>
                    <v-menu location="start" transition="slide-x-transition">
                      <template v-slot:activator="{ props }">
                        <v-btn icon v-bind=props color="black">
                          <v-icon color="black">mdi-dots-vertical</v-icon>
                        </v-btn>
                      </template>
                      <v-list>
                        <v-list-item @click="withdrawNft(item.raw)" v-if="item.raw.originalOwner.toLowerCase() == account.value">Withdraw the NFT</v-list-item>
                        <v-list-item @click="voteConfirm(item.raw)">Vote this NFT</v-list-item>
                      </v-list>
                    </v-menu>
                  </template>
                </v-toolbar>
              </v-img>
              <v-card-item>
                <v-card-title>{{ item.raw.title }}</v-card-title>
                <v-card-subtitle>{{ item.raw.description }}</v-card-subtitle>
                <template v-slot:append>
                  <v-badge color="error" :content="item.raw.votes ?? 0" inline size="x-large"></v-badge>
                </template>
              </v-card-item>
              <v-card-actions>
                <v-btn @click="voteConfirm(item.raw)" variant="outlined">VOTE for this NFT</v-btn>
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
      <v-card-subtitle>{{ dialog.content }}</v-card-subtitle>
      <v-card-text>
        <v-container>
          <v-slider v-model="slider" :max=Number(balance.value) :min="1" :step="1" hide-details show-ticks :disabled="balance.value == 0">
            <template v-slot:append>
              <v-text-field v-model="slider" hide-details single-line density="compact" type="number" style="width: 70px"></v-text-field>
            </template>
          </v-slider>
        </v-container>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn @click="dialog.status = false"> Cancel </v-btn>
        <v-btn @click="vote(dialog.nft, slider)"> Confirm </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
    
</template>

<script>
  import { connected , contract , account, balance } from '@/App.vue'
  import Web3 from 'web3'
  import axios from 'axios'
  import { snackbar , overlay , page } from '@/layouts/default/AppBar.vue'

  export default {
    name: 'Market',
    data() {
      return {
        connected: connected,
        contract: contract,
        account: account,
        balance: balance,
        allNft: [],
        nominatedNft: [],
        overlay: overlay,
        snackbar: snackbar,
        dialog: {
          title: "",
          content: "",
          nft: undefined,
          status: false
        },
        page: 1,
        route: page,
        isDataFetched: false,
        proportion: 0,
        slider: 1,
      }
    },
    methods: {
      getAllNft: async function () {
        this.overlay.callUp();

        const ALCHEMY_API_KEY = "YOUR_ALCHEMY_API_KEY";

        let optionsOnAlchemy = {
          method: 'GET',
          url: `https://eth-sepolia.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTs`,
          params: {
            owner: `${contract.address}`,
            withMetadata: 'true',
            pageSize: '100'
          },
          headers: {accept: 'application/json'}
        };

        await axios.request(optionsOnAlchemy)
          .then(response => {
            this.allNft = response.data.ownedNfts.filter(obj => obj.title != 'WIA' && obj.title != 'WIAT');

            this.allNft.forEach(nft => {
              this.contract.value?.methods.getVotesOnNft(nft.contract.address, nft.id.tokenId).call()
                .then(res => {
                  nft["votes"] = Number(res);
                })
                .catch(err => console.log(err));

              this.contract.value?.methods.getOriginalOwner(nft.contract.address, nft.id.tokenId).call()
                .then(res => {
                  nft["originalOwner"] = res;
                })
                .catch(err => console.log(err));
            });

            this.overlay.callDown();
            this.isDataFetched = true;
          })
          .catch(err => console.log(err));
      },
      checkBalance: async function() {
        if (this.connected.state) {
          this.balance.setMaximum(await this.contract.value?.methods.balanceOf(this.account.value, 1).call());
          this.balance.setValue(await this.contract.value?.methods.getVotesAvailable(this.account.value).call());
          this.proportion = Number(this.balance.value) / Number(this.balance.maximum) * 100;
        }
      },
      voteConfirm: async function (item) {
        if (!this.connected.state) {
          this.snackbar.call("Error", "Please connect your wallet first.", "error");
          return;
        }

        this.checkBalance();
        if (this.balance.value == 0) {
          this.snackbar.call("Error", "You have used up all your votes.", "error");
          return;
        }

        this.dialog.title = "Vote for a NFT";
        this.dialog.content = `Are you sure you want to vote for ${item.title}? The vote cannot be withdrawn.`;
        this.dialog.nft = item;

        this.dialog.status = true;
      },
      vote: async function (item, amount) {
        this.overlay.callUp();
        this.dialog.status = false;

        this.contract.value?.methods.vote(item.contract.address, item.id.tokenId, amount).send({ from: account.value.toString() })
          .then(res => {
            this.overlay.callDown();
            this.snackbar.call("Success", "Successfully voted!", "success");

            this.getAllNft();
            this.checkBalance();
          })
          .catch(err => {
            let message = err.message;
            if (message.includes("User denied")) {
              this.snackbar.call("Error", "User denied the transaction.", "error");
            }

            this.overlay.callDown();
          })
      },
      withdrawNft: async function (item) {
        this.overlay.callUp();

        let res = await this.contract.value?.methods.getIsVotingFinished().call()
        if (!res) {
          this.overlay.callDown();
          this.snackbar.call("Error", "The voting process has not finished.", "error");
          return;
        }

        this.contract.value?.methods.withdrawNft(item.contract.address, item.id.tokenId).send({ from: this.account.value })
          .then(res => {
            this.overlay.callDown();
            this.snackbar.call("Success", "Successfully Withdraw the NFT!", "success");
          })
          .catch(err => {
            this.overlay.callDown();
            console.log(err);
          })
      },
      toAccountConfirm: function () {
        if (!this.connected.state) {
          this.snackbar.call("Error", "Please connect your wallet first.", "error");
          return;
        }

        this.route.set("account");
      }
    },
    mounted() {
      this.getAllNft();
      this.checkBalance();
    },
    watch: {
      slider: function () {
        if (this.slider > this.balance.value) this.slider = this.balance.value;
        if (this.slider < 1) this.slider = 1;
      },
      'connected.state': function () {
        this.checkBalance();
      },
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
.market-intro {
  padding-top: 5%;
  padding-bottom: auto;
}
</style>