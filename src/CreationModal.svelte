<script lang="ts">
    export let isOpen: boolean;
    export let onClose: Function;
    export let onAccept: Function;

    export let title = "";
    export let content = "";
</script>

<div class={`fixed z-10 inset-0 overflow-y-auto ${isOpen ? "" : "hidden"}`} aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
  
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
  
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                New Todo
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Complete the fields, only the title is <strong>required</strong>.
                </p>
              </div>
              <div class="w-full py-5 flex flex-row flex-wrap">
                <label class="text-sm font-semibold uppercase">Title</label>    
                <input class="w-full h-9 mb-3 px-1 rounded-md" bind:value={title} />
                <label class="text-sm font-semibold uppercase">Content</label>
                <textarea class="w-full h-28 p-1 rounded-md"bind:value={content}></textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
          <button 
            disabled={!title}
            on:click={() => { onAccept({ title, content }); title = ""; content = ""; }}
            class="m-0 px-3 py-1 rounded-md shadow-sm border-2 border-green-600 text-sm font-semibold text-white bg-green-600 hover:bg-inherit hover:text-green-600 disabled:bg-gray-500 disabled:text-white disabled:cursor-not-allowed disabled:border-gray-500"
          >
              Save
          </button>
          <button 
              on:click={() => { onClose(); title = ""; content = ""; }}
              class="m-0 px-3 py-1 rounded-md shadow-sm border-2 border-gray-500 text-sm font-semibold hover:bg-gray-500 hover:text-white"
          >
              Cancel
          </button>
        </div>
      </div>
    </div>
  </div>