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

  let proportionalPalette = false;

  const BUCKET = "labels";
  const IMAGE_PATH = "test.png";
  const LABELS_PATH = "test.bin";

  let glContext;

  function toggleProprotionalPalette() {
    proportionalPalette = !proportionalPalette;
  }

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

<!-- TODO: add mobile support : vertical palette for desktop ? -->
<!-- TODO: add picture infos -->
<div class="dotted-background font-dekko">
  <!-- TODO: add dark theme -->
  <img class="top-right-image" alt="light" src="sun.svg" />
  <div class="layout">
    <h1>Palette</h1>

    {#if loading}
      <div class="hourglass-container">
        <img class="hourglass" src="hourglass-large.svg" alt="...coming" />
      </div>
    {:else if error}
      <p class="error">{error}</p>
    {/if}

    <div class="content-container" style:display={loading ? "none" : ""}>
      <canvas bind:this={canvas}></canvas>

      <div class="labels">
        <!-- TODO: beautiful button -->
        <button on:click={toggleProprotionalPalette}
          ><img
            alt="selection-choice"
            width="80px"
            src={proportionalPalette
              ? "equivalent-select.svg"
              : "proportional-select.svg"}
          />
        </button>
        <div class="colors-column">
          {#each labelColors as { id, color, sortedIndex, size }}
            <!-- TODO: add minimal size -->
            <button
              class="color-square"
              class:active={selectedLabel === id}
              style="background: {color}; flex: {proportionalPalette
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
</div>

<!-- TODO: clean style -->
<!-- TODO: better selection display : add svg arrow -->

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

  .content-container {
    display: flex;
    gap: 5rem;
    align-items: flex-start;
    width: 100%;
    max-width: 1400px;
    justify-content: center;
  }

  .top-right-image {
    @apply absolute top-0 right-0;
    width: 90px;
    height: 90px;
  }

  .dotted-background {
    font-family: "Dekko", cursive;
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
    @apply absolute -left-17 top-1/2 -translate-y-1/2 
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
    flex-direction: column;
    gap: 0.5rem;
    width: 80px;
    height: fit-content;
  }

  .hourglass {
    height: 90px;
    animation: rotation 2s ease-in-out infinite;
  }

  .hourglass-container {
    height: 80vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .colors-column {
    display: flex;
    flex-direction: column;
    gap: 1px;
    height: 600px; /* or match your canvas height */
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
