<template>
  <v-overlay :model-value="overlay.status" persistent class="align-center justify-center">
    <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
  </v-overlay>

  <v-app-bar :elevation="2">
    <v-app-bar-nav-icon  @click.stop="drawer = !drawer" />
    <v-app-bar-title>
      What Is Art?
    </v-app-bar-title>

    <v-spacer/>

    <v-btn v-if="!connected.state" @click="connectWallet">Connect wallet</v-btn>
    <v-btn v-if="connected.state" @click="copyAddress">Address: {{ account.value }}</v-btn>
    <v-btn icon @click="toggleTheme()">
      <v-icon v-if="theme.global.name.value == 'light'">mdi-weather-sunny</v-icon>
      <v-icon v-if="theme.global.name.value == 'dark'">mdi-weather-night</v-icon>
    </v-btn>
    <v-btn icon @click="dialog = true"><v-icon>mdi-information-outline</v-icon></v-btn>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" temporary>
    <v-list v-model="page" nav>
      <v-list-item title="Home" prepend-icon="mdi-home" @click="page.set('home')" :active="$route.name?.toString().toLowerCase() == 'home'"></v-list-item>
      <v-list-item title="Market" prepend-icon="mdi-cart" @click="page.set('market')" :active="$route.name?.toString().toLowerCase() == 'market'"></v-list-item>
      <v-list-item title="Account" prepend-icon="mdi-account" @click="page.set('account')" :active="$route.name?.toString().toLowerCase() == 'account'"></v-list-item>
      <v-list-item title="Donate" prepend-icon="mdi-gift" @click="page.set('donate')" :active="$route.name?.toString().toLowerCase() == 'donate'"></v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-snackbar v-model="snackbar.status" :color=snackbar.type timeout="2500">
    <v-alert :type=snackbar.type :title=snackbar.title :text=snackbar.content></v-alert>
  </v-snackbar>

  <v-dialog v-model="dialog" width="600">
    <v-card>
      <v-card-title>Information</v-card-title>
      <v-divider></v-divider>
      <v-card-text class="mb-2">
        A simple implementation of my Blockchain & Decentralized Application Final Project.
        <br/><br/>
        Made by <a href="https://kutinai.com" target="_blank">Kuchinashi Hoshikawa</a>.
        
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
  import { connected , contract , account, balance } from '@/App.vue'
  import Web3, { Contract } from 'web3'
  import { reactive } from 'vue'
  import { useTheme } from 'vuetify'

  export const snackbar = reactive ({
    title: "",
    content: "",
    type: undefined,
    status: false,
    call: function (title, content, type) {
        this.title = title;
        this.content = content;
        this.type = type;

        this.status = true;
      }
  });

  export const overlay = reactive ({
    status: false,
    callUp: function () {
      this.status = true;
    },
    callDown: function () {
      this.status = false;
    }
  });

  export const page = reactive ({
    value: "home",
    set: function (_value) {
      this.value = _value
    }
  });

  export default {
    name: "AppBar",
    setup() {
      const theme = useTheme();
      return {
        theme,
        toggleTheme: () => {
          theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
        },
      }
    },
    data() {
      return {
        drawer: false,
        dialog: false,
        page: page,
        connected: connected,
        contract: contract,
        account: account,
        balance: balance,
        snackbar: snackbar,
        overlay: overlay,
      }
    },
    methods:{
      connectWallet: function () {
        if (window.ethereum) {
          window.ethereum.request({ method: 'eth_requestAccounts' }).then((res) => {
            this.account.set(res[0]);

            this.connected.switch();
          });
        }
      },
      connectContract: function () {
        let web3 = new Web3(window.ethereum);

        this.contract.set(new web3.eth.Contract(contract.abi, contract.address));
        console.log("Connect Success");
      },
      copyAddress: function () {
        let newInput = document.createElement("input");
        newInput.value = this.account.value.toString();
        document.body.appendChild(newInput);
        newInput.select();
        document.execCommand("Copy");
        newInput.remove();

        this.snackbar.call("Success", "Address Copied!", "success");
      },
    },
    watch: {
      'page.value': function () {
        let thisPage = this.$route.name?.toString().toLowerCase() ?? 'home';

        if (this.page.value == "account" && !this.connected.state) {
          this.page.set(thisPage);
          this.snackbar.call("Error", "Please connect to the wallet first.", "error");
          return;
        }

        if (thisPage != this.page.value) {
          if (this.page.value == "home") this.$router.replace('/');
          else this.$router.replace(`/${this.page.value}`);
        }
      }
    },
    mounted() {
      this.connectContract();
      this.page.value = this.$route.name ? this.$route.name.toString().toLowerCase() : "home";
      this.theme.global.name.value = 'dark';
    }
  }
</script>

<style>
  a {
    text-decoration: none;
    color: grey;
  }
</style>
