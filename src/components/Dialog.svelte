<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    open: boolean;
    title: string;
    children?: Snippet;
    actions: Snippet;
  }
  let { open, title, children, actions }: Props = $props();
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    role="presentation"
  >
    <div
      class="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <h2 id="dialog-title" class="mb-3 text-lg font-bold">{title}</h2>
      {#if children}<div class="mb-4 text-stone-700">
          {@render children()}
        </div>{/if}
      <div class="flex flex-wrap justify-end gap-2">{@render actions()}</div>
    </div>
  </div>
{/if}
