<template>
  <v-container class="bg fill-height" fluid>
    <v-sheet class="d-flex align-center justify-center flex-wrap text-center mx-auto" elevation="4" height="500" rounded max-width="800" width="100%">
      <div>
        <h1 class="text-h3 font-weight-black text-orange title">Why donate?</h1>

        <div class="text-h5 font-weight-medium mb-2 subtitle">
          You can get additional votes by donating us!
        </div>

        <v-divider></v-divider>

        <div class="description">
          <p>
            Everyone can get 3 votes for free. After that, the price is 0.01 Ether per additional vote.
          </p>

          <p>
            The total maximum of vote for 1 account is 10.
          </p>

          <p>
            Income from donation will be used for holding offline <b>WHAT IS ART Crypto Art Exhibition</b>.
          </p>
        </div>

        <v-divider></v-divider>

        <div class="donate">
          <v-slider v-model="slider" class="align-center" :max=maxDonate :min="0" :step="1" hide-details show-ticks style="margin-bottom: 24px;" :disabled="maxDonate == 0">
            <template v-slot:append>
              <v-text-field v-model="slider" hide-details single-line density="compact" type="number" style="width: 70px"></v-text-field>
            </template>
          </v-slider>

          <v-btn variant="outlined" size="x-large" color="orange" @click="donate">Donate {{ slider / 100 }} Ether</v-btn>
        </div>
      </div>
    </v-sheet>
  </v-container>

  <v-dialog v-model="dialog.status" width="500">
    <v-card>
      <v-card-title>{{ dialog.title }}</v-card-title>
      <v-card-text>
        {{ dialog.content }}
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn @click="dialog.status = false"> Cancel </v-btn>
        <v-btn @click=""> Confirm </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
    
</template>

<script>
  import { connected , contract , account, balance } from '@/App.vue'
  import Web3, { eth } from 'web3'
  import axios from 'axios'
  import { snackbar , overlay } from '@/layouts/default/AppBar.vue'

  export default {
    name: 'Market',
    data() {
      return {
        connected: connected,
        contract: contract,
        account: account,
        balance: balance,
        overlay: overlay,
        snackbar: snackbar,
        dialog: {
          title: "",
          content: "",
          nft: undefined,
          status: false
        },
        slider: 0,
        maxDonate: 7
      }
    },
    methods: {
      donate: function () {
        if (!this.connected.state) {
          this.snackbar.call("Error", "Please connect your wallet first.", "error");
          return;
        }

        if (this.slider == 0) return;

        this.overlay.callUp();

        let tx = {
          from: this.account.value,
          to: this.contract.address.toString(),
          value: this.slider * 10 ** 16
        };

        let web3 = new Web3(window.ethereum);

        web3.eth.sendTransaction(tx)
          .then(res => {
            this.overlay.callDown();
            
            this.snackbar.call("Success", "Successfully Donated, Thank you!", "success");
            this.getMaxDonation();
          })
          .catch(err => {
            let message = err.message;
            if (message.includes("User denied")) {
              this.snackbar.call("Error", "User denied the transaction.", "error");
            }

            this.overlay.callDown();

            console.log(err);
          });

        this.getMaxDonation();
      },
      getMaxDonation: function () {
        if (this.connected.state) {
          this.contract.value?.methods.getAvailablePremiumVotes(this.account.value).call()
            .then(res => {
              this.maxDonate = Number(res);
            })
            .catch(err => {
              console.log(err);
            })
        }
      }
    },
    watch: {
      slider: function () {
        if (this.slider > this.maxDonate) this.slider = this.maxDonate;
        if (this.slider < 0) this.slider = 0;
      },
      'connect.state': function () {
        this.getMaxDonation();
      }
    },
    mounted() {
      this.getMaxDonation();
    }
  }
</script>

<style>
  .bg {
    background: url(../assets/bg.webp) no-repeat 50% 50%;
    background-size: cover;
    position: flex;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .title {
    margin-top: 5%;
    margin-bottom: 24px;
  }
  .subtitle {
    margin-bottom: 48px;
  }
  .description {
    margin-top: 24px;
    margin-bottom: 24px;
    line-height: 1.75rem;
  }
  .donate {
    margin-top: 5%
  }
</style>