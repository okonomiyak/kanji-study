<script lang="ts">
  import { router } from "./state/router.svelte";
  import TrialScreen from "./screens/trial/TrialScreen.svelte";
</script>

{#if router.current === "trial"}
  <TrialScreen />
{:else}
  <main class="flex min-h-full flex-col items-center justify-center gap-4 p-4">
    <p class="text-2xl">準備中</p>
    <a class="underline" href="#/trial">試し書き</a>
  </main>
{/if}
