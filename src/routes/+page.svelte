<script>
  import { onMount } from "svelte";
  import { loadImageAndLabels, loadPalette } from "$lib/supabase";
  import { initWebGL, renderScene } from "$lib/webgl";

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

<div class="container">
  <h1>Palette</h1>

  {#if loading}
    <p>Loading...</p>
  {:else if error}
    <p class="error">{error}</p>
  {/if}

  <canvas bind:this={canvas}></canvas>

  <div class="labels">
    {#each Object.entries(labelColors) as [id, hexColor]}
      <button
        class:active={selectedLabel === Number(id)}
        on:click={() => selectLabel(Number(id))}
      >
        <span style="background: {hexColor}"></span>
        {hexColor}
      </button>
    {/each}
    <button on:click={() => selectLabel(null)}>Clear</button>
  </div>
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
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
    border: 2px solid #ddd;
  }

  .labels {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  button {
    padding: 0.5rem 1rem;
    border: 2px solid #ddd;
    background: white;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  button:hover {
    background: #f0f0f0;
  }

  button.active {
    border-color: #2196f3;
    background: #e3f2fd;
  }

  button span {
    width: 20px;
    height: 20px;
    border-radius: 3px;
    border: 1px solid #999;
  }
</style>
