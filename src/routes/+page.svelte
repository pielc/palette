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

  const PROPORTIONAL_PALETTE = true;

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

      console.log(labelColors);
      labelColors.sort((a, b) => a.sortedIndex < b.sortedIndex);

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
  <img class="top-right-image" alt="light" src="sun.svg" />
  <div class="layout">
    <h1>Palette</h1>

    {#if loading}
      <div class="hourglass-container">
        <img class="hourglass" src="hourglass.svg" alt="...coming" />
      </div>
    {:else if error}
      <p class="error">{error}</p>
    {/if}

    <canvas style:display={loading ? "none" : ""} bind:this={canvas}></canvas>

    <div class="labels">
      <!-- <div class="grid grid-cols-4 md:grid-cols-7 gap-3"> -->
      <div class="flex gap-1">
        {#each labelColors as { id, color, sortedIndex, size }}
          <button
            class="color-square"
            class:active={selectedLabel === id}
            style="background: {color}; flex: {PROPORTIONAL_PALETTE
              ? size
              : 1 / labelColors.length}"
            on:click={() => selectLabel(id)}
          >
            <div class="color-tooltip">{color}</div>
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  @reference "tailwindcss";

  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center; /* horizontal alignment */
    gap: 1rem; /* spacing between h1 / canvas / labels */
    padding: 1rem;
  }

  .top-right-image {
    @apply absolute top-0 right-0;
    width: 90px;
    height: 90px;
  }

  .dotted-background {
    font-family: "Dekko", cursive;
    /* height: 120vh; */
    background-image: radial-gradient(circle, #777 1px, transparent 1px);
    background-size: 15px 15px;
  }

  .color-square {
    @apply relative w-21 h-21 cursor-pointer 
    /* transition-all duration-200 hover:scale-110 hover:shadow-lg; */
    transition-all duration-200;
  }

  .color-square.active {
    /* @apply border-3 border-gray-800 scale-105 shadow-xl; */
    @apply border-3 border-gray-800 shadow-xl;
  }

  .color-tooltip {
    @apply absolute -top-10 left-1/2 -translate-x-1/2 
      px-2 py-1 text-black text-lg opacity-0 pointer-events-none
      transition-opacity duration-200 whitespace-nowrap;
  }

  .color-square:hover .color-tooltip {
    @apply opacity-100;
  }

  h1 {
    font-size: 45px;
    color: #444;
    text-align: center;
  }

  .error {
    color: #c33;
    text-align: center;
  }

  canvas {
    max-width: 100%;
    background-color: #000;
  }

  .labels {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 3em;
  }

  .hourglass {
    height: 90px;
    animation: rotation 3s ease-in-out infinite;
  }

  .hourglass-container {
    height: 100vh;
    justify-content: center;
    align-items: center;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(180deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
