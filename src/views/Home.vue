<template>
  <v-container class="bg fill-height" fluid>
    <v-row>
      <v-col align-self="center" class="text-center">
        <h1 class="text-h1 mb-4"> What Is Art? </h1>
        <h4 class="text-h4 font-weight-light subheading"> Vote for Your ART Today </h4>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import { connected, contract, account, balance, UserNFT } from '@/App.vue'

  export default {
    name: 'Home',
    data() {
      return {
        connected: connected,
        contract: contract,
        account: account,
        balance: balance,
        snackbar: false,
        userNFT: UserNFT,
        loading: true,
      }
    },
    methods: {
    }
  }
</script>

<style>
  .parallax {
    max-height: calc(100% - 64px);
    overflow: hidden;
  }

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

  ::-webkit-scrollbar {
    display: none; /* Chrome Safari */
  }
</style>