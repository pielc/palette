<script>
  import { onMount } from "svelte";
  import { loadImageAndLabels, loadPalette } from "$lib/supabase";
  import { initWebGL, renderScene } from "$lib/webgl";
  import "@fontsource/dekko";

  let canvas;
  let selectedLabel = null;
  let selectedColor = null;
  let loading = true;
  let error = null;

  let labelColors = {};

  let proportionalPalette = false;

  const MINIMAL_PALETTE_RECTANGLE_SIZE = 0.05;
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

  function selectLabel(id, color) {
    selectedLabel = selectedLabel === id ? null : id;
    selectedColor = selectedLabel !== null ? color : null;
    render();
  }

  // TODO: handle no data
  onMount(() => {
    loadData();
  });
</script>

<!-- TODO: add mobile support -->
<!-- TODO: handle small width on desktop -->
<div class="dotted-background font-dekko">
  <!-- TODO: add dark theme -->
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

    <div class="content-container" style:display={loading ? "none" : ""}>
      <canvas bind:this={canvas}></canvas>

      <div class="labels">
        <button on:click={toggleProprotionalPalette}>
          <img
            alt="selection-choice"
            width="80px"
            src={proportionalPalette
              ? "equivalent-select.svg"
              : "proportional-select.svg"}
          />
        </button>
        <div class="colors-column">
          {#each labelColors as { id, color, sortedIndex, size }}
            <button
              class="color-square"
              class:active={selectedLabel === id}
              style="background: {color}; flex: {proportionalPalette
                ? size > MINIMAL_PALETTE_RECTANGLE_SIZE
                  ? size
                  : MINIMAL_PALETTE_RECTANGLE_SIZE
                : 1}"
              on:click={() => selectLabel(id, color)}
            >
              <img
                class="arrow-indicator"
                class:selected={selectedLabel === id}
                src="arrow.svg"
                alt="selected"
              />
            </button>
          {/each}
        </div>
      </div>
    </div>
    <!-- TODO: beautify -->
    <div class="info-panel" style:display={loading ? "none" : ""}>
      <!-- TODO: retrieve with API  -->
      <div class="flex-1 art-info">
        <div class="font-bold">Cliff Walk at Pourville</div>
        <div>1882</div>
        <div>Claude Monet (French, 1840–1926)</div>
      </div>
      <div class="flex-1 color-info">
        {#if selectedColor}
          <div class="color-swatch" style="background: {selectedColor}"></div>
          <div class="color-details">
            <div>{selectedColor}</div>
            <!-- TODO: retrieve with API -->
            <div class="color-name-placeholder">Color name</div>
          </div>
        {:else}
          <div></div>
        {/if}
      </div>
    </div>
  </div>
  <div class="footer-caption">"I prefer living in color." - David Hockney</div>
</div>

<!-- TODO: clean style -->

<style>
  @reference "tailwindcss";

  .dotted-background {
    font-family: "Dekko", cursive;
    background-image: radial-gradient(circle, #777 1px, transparent 1px);
    background-size: 15px 15px;
  }

  .footer-caption {
    position: absolute;
    bottom: 0px;
    width: 100%;
    font-style: italic;
    text-align: center;
  }
  .top-right-image {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 90px;
    height: 90px;
  }

  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }

  h1 {
    font-size: 45px;
    color: #444;
    text-align: center;
  }

  .content-container {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
    width: 100%;
    max-width: 900px;
    justify-content: center;
    min-width: 0;
  }

  canvas {
    min-width: 0;
    width: 100%;
    background-color: #000;
  }

  .labels {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 80px;
    flex-shrink: 0;
    height: fit-content;
    margin-right: 2.5rem;
  }

  .colors-column {
    display: flex;
    flex-direction: column;
    gap: 1px;
    height: 500px;
    max-height: 70vh;
  }

  .color-square {
    @apply relative cursor-pointer transition-all duration-200;
  }

  .color-square:hover .arrow-indicator {
    @apply opacity-100;
  }

  .arrow-indicator {
    @apply absolute -right-13 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200;
    height: 30px;
  }

  .arrow-indicator.selected {
    @apply opacity-100;
  }

  .info-panel {
    display: flex;
    width: 100%;
    max-width: 900px;
    min-width: 0;
    gap: 1rem;
  }

  .art-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .color-info {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    min-width: 0;
    flex-shrink: 1;
  }

  .color-swatch {
    aspect-ratio: 1;
    align-self: stretch;
    flex-shrink: 0;
  }

  .color-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    overflow-wrap: break-word;
    word-break: break-all;
  }

  .color-name-placeholder {
    color: #999;
    font-style: italic;
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

  .error {
    color: #c33;
    text-align: center;
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
