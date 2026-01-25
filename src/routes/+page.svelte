<script>
  import { onMount } from "svelte";
  import { loadImageAndLabels, loadPalette } from "$lib/supabase";
  import { initWebGL, renderScene } from "$lib/webgl";
  import "@fontsource/dekko";

  let canvas;
  let selectedLabel = null;
  let loading = true;
  let error = null;

  let labelColors = {};

  const BUCKET = "labels";
  const IMAGE_PATH = "test.png";
  const LABELS_PATH = "test.bin";

  let glContext;

  async function loadData() {
    try {
      const { image, labels, width, height } = await loadImageAndLabels(
        BUCKET,
        IMAGE_PATH,
        LABELS_PATH,
      );

      labelColors = await loadPalette();

      canvas.width = width;
      canvas.height = height;

      glContext = initWebGL(canvas, image, labels, width, height);
      render();
      loading = false;
    } catch (err) {
      error = err.message;
      console.error(err);
      loading = false;
    }
  }

  function render() {
    if (!glContext) return;
    renderScene(glContext, selectedLabel);
  }

  function selectLabel(id) {
    selectedLabel = selectedLabel === id ? null : id;
    render();
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="dotted-background font-dekko">
  <h1>Palette</h1>

  {#if loading}
    <p>Loading...</p>
  {:else if error}
    <p class="error">{error}</p>
  {/if}

  <canvas bind:this={canvas}></canvas>

  <div class="labels">
    <div class="flex justify-center mt-20">
      <div class="grid grid-cols-4 md:grid-cols-7 gap-3">
        {#each Object.entries(labelColors) as [id, hexColor]}
          <button
            class="color-square"
            class:active={selectedLabel === id}
            style="background: {hexColor}"
            on:click={() => selectLabel(id)}
            aria-label="Select color {hexColor}"
          >
            <div class="color-tooltip">
              {hexColor}
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  @reference "tailwindcss";

  .dotted-background {
    font-family: "Dekko", cursive;
    height: 100vh;
    background-image: radial-gradient(circle, #777 1px, transparent 1px);
    background-size: 15px 15px;
  }

  .color-square {
    @apply relative w-21 h-21 cursor-pointer 
    transition-all duration-200 hover:scale-110 hover:shadow-lg;
  }

  .color-square.active {
    @apply border-4 border-black scale-105 shadow-xl;
  }

  .color-tooltip {
    @apply absolute -top-10 left-1/2 -translate-x-1/2 
      px-2 py-1 text-black text-sm opacity-0 pointer-events-none
      transition-opacity duration-200 whitespace-nowrap;
  }

  .color-square:hover .color-tooltip {
    @apply opacity-100;
  }

  h1 {
    text-align: center;
  }

  .error {
    color: #c33;
    text-align: center;
  }

  canvas {
    display: block;
    max-width: 100%;
    margin: 1rem auto;
    /* border: 2px solid #ddd; */
    background-color: #000;
  }

  .labels {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }
</style>
