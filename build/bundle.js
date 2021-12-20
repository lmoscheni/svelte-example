
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    var getRandomValues;
    var rnds8 = new Uint8Array(16);
    function rng() {
      // lazy load so that environments that need to polyfill have a chance to do so
      if (!getRandomValues) {
        // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
        // find the complete implementation of crypto (msCrypto) on IE11.
        getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

        if (!getRandomValues) {
          throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
      }

      return getRandomValues(rnds8);
    }

    var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

    function validate(uuid) {
      return typeof uuid === 'string' && REGEX.test(uuid);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    var byteToHex = [];

    for (var i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).substr(1));
    }

    function stringify(arr) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      // Note: Be careful editing this code!  It's been tuned for performance
      // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
      var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
      // of the following:
      // - One or more input array values don't map to a hex octet (leading to
      // "undefined" in the uuid)
      // - Invalid input values for the RFC `version` or `variant` fields

      if (!validate(uuid)) {
        throw TypeError('Stringified UUID is invalid');
      }

      return uuid;
    }

    function v4(options, buf, offset) {
      options = options || {};
      var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

      rnds[6] = rnds[6] & 0x0f | 0x40;
      rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

      if (buf) {
        offset = offset || 0;

        for (var i = 0; i < 16; ++i) {
          buf[offset + i] = rnds[i];
        }

        return buf;
      }

      return stringify(rnds);
    }

    /* src/Todo.svelte generated by Svelte v3.44.3 */

    const file$2 = "src/Todo.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let input0;
    	let input0_disabled_value;
    	let t0;
    	let input1;
    	let t1;
    	let textarea;
    	let textarea_disabled_value;
    	let t2;
    	let button0;
    	let t3;
    	let t4;
    	let button1;
    	let t5_value = (/*isEditionMode*/ ctx[1] ? "cancel" : "Update") + "";
    	let t5;
    	let t6;
    	let button2;
    	let t7;
    	let button2_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			textarea = element("textarea");
    			t2 = space();
    			button0 = element("button");
    			t3 = text("Delete");
    			t4 = space();
    			button1 = element("button");
    			t5 = text(t5_value);
    			t6 = space();
    			button2 = element("button");
    			t7 = text("Save");
    			attr_dev(input0, "class", "px-1 text-lg font-semibold self-center border-none disabled:text-black disabled:bg-inherit");
    			input0.disabled = input0_disabled_value = !/*isEditionMode*/ ctx[1];
    			add_location(input0, file$2, 7, 8, 242);
    			attr_dev(input1, "class", "h-6 w-6 self-center bg-slate-50 accent-green-600");
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$2, 8, 8, 409);
    			attr_dev(div0, "class", "flex flex-row justify-between");
    			add_location(div0, file$2, 6, 4, 190);
    			attr_dev(textarea, "class", "w-full my-3 p-1 rounded-sm border-none text-sm disabled:text-black disabled:bg-inherit");
    			textarea.disabled = textarea_disabled_value = !/*isEditionMode*/ ctx[1];
    			add_location(textarea, file$2, 10, 4, 535);
    			attr_dev(button0, "class", "px-3 py-1 border-2 border-red-600 text-sm text-white font-semibold rounded-md bg-red-600 hover:bg-inherit hover:text-red-600 disabled:hidden");
    			button0.disabled = /*isEditionMode*/ ctx[1];
    			add_location(button0, file$2, 11, 4, 698);
    			attr_dev(button1, "class", `px-3 py-1 border-2 border-cyan-600 text-sm text-white font-semibold rounded-md bg-cyan-600 hover:bg-inherit hover:text-cyan-600`);
    			add_location(button1, file$2, 12, 4, 934);
    			attr_dev(button2, "class", "px-3 py-1 border-2 border-cyan-600 text-sm text-white font-semibold rounded-md bg-green-600 hover:bg-inherit hover:text-green-600 disabled:hidden");
    			button2.disabled = button2_disabled_value = !/*isEditionMode*/ ctx[1];
    			add_location(button2, file$2, 18, 4, 1220);
    			attr_dev(div1, "class", "w-full sm:3/5 md:w-2/5 xl:w-1/4 p-5 bg-blue-100 rounded-lg shadow-md");
    			add_location(div1, file$2, 5, 0, 103);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*item*/ ctx[0].title);
    			append_dev(div0, t0);
    			append_dev(div0, input1);
    			input1.checked = /*item*/ ctx[0].checked;
    			append_dev(div1, t1);
    			append_dev(div1, textarea);
    			set_input_value(textarea, /*item*/ ctx[0].content);
    			append_dev(div1, t2);
    			append_dev(div1, button0);
    			append_dev(button0, t3);
    			append_dev(div1, t4);
    			append_dev(div1, button1);
    			append_dev(button1, t5);
    			append_dev(div1, t6);
    			append_dev(div1, button2);
    			append_dev(button2, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[4]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[5]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[6], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[7], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isEditionMode*/ 2 && input0_disabled_value !== (input0_disabled_value = !/*isEditionMode*/ ctx[1])) {
    				prop_dev(input0, "disabled", input0_disabled_value);
    			}

    			if (dirty & /*item*/ 1 && input0.value !== /*item*/ ctx[0].title) {
    				set_input_value(input0, /*item*/ ctx[0].title);
    			}

    			if (dirty & /*item*/ 1) {
    				input1.checked = /*item*/ ctx[0].checked;
    			}

    			if (dirty & /*isEditionMode*/ 2 && textarea_disabled_value !== (textarea_disabled_value = !/*isEditionMode*/ ctx[1])) {
    				prop_dev(textarea, "disabled", textarea_disabled_value);
    			}

    			if (dirty & /*item*/ 1) {
    				set_input_value(textarea, /*item*/ ctx[0].content);
    			}

    			if (dirty & /*isEditionMode*/ 2) {
    				prop_dev(button0, "disabled", /*isEditionMode*/ ctx[1]);
    			}

    			if (dirty & /*isEditionMode*/ 2 && t5_value !== (t5_value = (/*isEditionMode*/ ctx[1] ? "cancel" : "Update") + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*isEditionMode*/ 2 && button2_disabled_value !== (button2_disabled_value = !/*isEditionMode*/ ctx[1])) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Todo', slots, []);
    	let { item } = $$props;
    	let { removeTodo } = $$props;
    	let { isEditionMode = false } = $$props;
    	const writable_props = ['item', 'removeTodo', 'isEditionMode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Todo> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		item.title = this.value;
    		$$invalidate(0, item);
    	}

    	function input1_change_handler() {
    		item.checked = this.checked;
    		$$invalidate(0, item);
    	}

    	function textarea_input_handler() {
    		item.content = this.value;
    		$$invalidate(0, item);
    	}

    	const click_handler = () => removeTodo(item);

    	const click_handler_1 = () => {
    		$$invalidate(1, isEditionMode = !isEditionMode);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(1, isEditionMode = !isEditionMode);
    	};

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('removeTodo' in $$props) $$invalidate(2, removeTodo = $$props.removeTodo);
    		if ('isEditionMode' in $$props) $$invalidate(1, isEditionMode = $$props.isEditionMode);
    	};

    	$$self.$capture_state = () => ({ item, removeTodo, isEditionMode });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('removeTodo' in $$props) $$invalidate(2, removeTodo = $$props.removeTodo);
    		if ('isEditionMode' in $$props) $$invalidate(1, isEditionMode = $$props.isEditionMode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		item,
    		isEditionMode,
    		removeTodo,
    		input0_input_handler,
    		input1_change_handler,
    		textarea_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Todo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { item: 0, removeTodo: 2, isEditionMode: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todo",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !('item' in props)) {
    			console.warn("<Todo> was created without expected prop 'item'");
    		}

    		if (/*removeTodo*/ ctx[2] === undefined && !('removeTodo' in props)) {
    			console.warn("<Todo> was created without expected prop 'removeTodo'");
    		}
    	}

    	get item() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeTodo() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set removeTodo(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isEditionMode() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isEditionMode(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CreationModal.svelte generated by Svelte v3.44.3 */

    const file$1 = "src/CreationModal.svelte";

    function create_fragment$1(ctx) {
    	let div9;
    	let div8;
    	let div0;
    	let t0;
    	let span;
    	let t2;
    	let div7;
    	let div5;
    	let div4;
    	let div3;
    	let h3;
    	let t4;
    	let div1;
    	let p;
    	let t6;
    	let div2;
    	let label0;
    	let t8;
    	let input;
    	let t9;
    	let label1;
    	let t11;
    	let textarea;
    	let t12;
    	let div6;
    	let button0;
    	let t13;
    	let button0_disabled_value;
    	let t14;
    	let button1;
    	let div9_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div8 = element("div");
    			div0 = element("div");
    			t0 = space();
    			span = element("span");
    			span.textContent = "​";
    			t2 = space();
    			div7 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			h3 = element("h3");
    			h3.textContent = "New Todo";
    			t4 = space();
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "Complete al the fields";
    			t6 = space();
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "Title";
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			label1 = element("label");
    			label1.textContent = "Content";
    			t11 = space();
    			textarea = element("textarea");
    			t12 = space();
    			div6 = element("div");
    			button0 = element("button");
    			t13 = text("Save");
    			t14 = space();
    			button1 = element("button");
    			button1.textContent = "Cancel";
    			attr_dev(div0, "class", "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity");
    			attr_dev(div0, "aria-hidden", "true");
    			add_location(div0, file$1, 9, 6, 387);
    			attr_dev(span, "class", "hidden sm:inline-block sm:align-middle sm:h-screen");
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$1, 11, 6, 494);
    			attr_dev(h3, "class", "text-lg leading-6 font-medium text-gray-900");
    			attr_dev(h3, "id", "modal-title");
    			add_location(h3, file$1, 17, 14, 963);
    			attr_dev(p, "class", "text-sm text-gray-500");
    			add_location(p, file$1, 21, 16, 1131);
    			attr_dev(div1, "class", "mt-2");
    			add_location(div1, file$1, 20, 14, 1096);
    			attr_dev(label0, "class", "text-sm font-semibold uppercase");
    			add_location(label0, file$1, 26, 16, 1328);
    			attr_dev(input, "class", "w-full mb-3 px-1 rounded-md");
    			add_location(input, file$1, 27, 16, 1409);
    			attr_dev(label1, "class", "text-sm font-semibold uppercase");
    			add_location(label1, file$1, 28, 16, 1490);
    			attr_dev(textarea, "class", "w-full p-1 rounded-md");
    			add_location(textarea, file$1, 29, 16, 1569);
    			attr_dev(div2, "class", "w-full py-5 flex flex-row flex-wrap");
    			add_location(div2, file$1, 25, 14, 1262);
    			attr_dev(div3, "class", "mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left");
    			add_location(div3, file$1, 16, 12, 889);
    			attr_dev(div4, "class", "sm:flex sm:items-start");
    			add_location(div4, file$1, 15, 10, 840);
    			attr_dev(div5, "class", "bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4");
    			add_location(div5, file$1, 14, 8, 777);
    			button0.disabled = button0_disabled_value = !/*title*/ ctx[0];
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-500 disabled:text-white disabled:cursor-not-allowed");
    			add_location(button0, file$1, 35, 12, 1784);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm");
    			add_location(button1, file$1, 43, 12, 2370);
    			attr_dev(div6, "class", "bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse");
    			add_location(div6, file$1, 34, 8, 1701);
    			attr_dev(div7, "class", "inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full");
    			add_location(div7, file$1, 13, 6, 602);
    			attr_dev(div8, "class", "flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0");
    			add_location(div8, file$1, 8, 4, 280);
    			attr_dev(div9, "class", div9_class_value = `fixed z-10 inset-0 overflow-y-auto ${/*isOpen*/ ctx[2] ? "" : "hidden"}`);
    			attr_dev(div9, "aria-labelledby", "modal-title");
    			attr_dev(div9, "role", "dialog");
    			attr_dev(div9, "aria-modal", "true");
    			add_location(div9, file$1, 7, 0, 137);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			append_dev(div8, div0);
    			append_dev(div8, t0);
    			append_dev(div8, span);
    			append_dev(div8, t2);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, h3);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			append_dev(div1, p);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, label0);
    			append_dev(div2, t8);
    			append_dev(div2, input);
    			set_input_value(input, /*title*/ ctx[0]);
    			append_dev(div2, t9);
    			append_dev(div2, label1);
    			append_dev(div2, t11);
    			append_dev(div2, textarea);
    			append_dev(div7, t12);
    			append_dev(div7, div6);
    			append_dev(div6, button0);
    			append_dev(button0, t13);
    			append_dev(div6, t14);
    			append_dev(div6, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[6], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1 && input.value !== /*title*/ ctx[0]) {
    				set_input_value(input, /*title*/ ctx[0]);
    			}

    			if (dirty & /*title*/ 1 && button0_disabled_value !== (button0_disabled_value = !/*title*/ ctx[0])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*isOpen*/ 4 && div9_class_value !== (div9_class_value = `fixed z-10 inset-0 overflow-y-auto ${/*isOpen*/ ctx[2] ? "" : "hidden"}`)) {
    				attr_dev(div9, "class", div9_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CreationModal', slots, []);
    	let { isOpen } = $$props;
    	let { onClose } = $$props;
    	let { onAccept } = $$props;
    	let { title = "" } = $$props;
    	let { content = "" } = $$props;
    	const writable_props = ['isOpen', 'onClose', 'onAccept', 'title', 'content'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CreationModal> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		title = this.value;
    		$$invalidate(0, title);
    	}

    	const click_handler = () => {
    		onAccept({ title, content });
    		$$invalidate(0, title = "");
    		$$invalidate(1, content = "");
    	};

    	const click_handler_1 = () => onClose();

    	$$self.$$set = $$props => {
    		if ('isOpen' in $$props) $$invalidate(2, isOpen = $$props.isOpen);
    		if ('onClose' in $$props) $$invalidate(3, onClose = $$props.onClose);
    		if ('onAccept' in $$props) $$invalidate(4, onAccept = $$props.onAccept);
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('content' in $$props) $$invalidate(1, content = $$props.content);
    	};

    	$$self.$capture_state = () => ({
    		isOpen,
    		onClose,
    		onAccept,
    		title,
    		content
    	});

    	$$self.$inject_state = $$props => {
    		if ('isOpen' in $$props) $$invalidate(2, isOpen = $$props.isOpen);
    		if ('onClose' in $$props) $$invalidate(3, onClose = $$props.onClose);
    		if ('onAccept' in $$props) $$invalidate(4, onAccept = $$props.onAccept);
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('content' in $$props) $$invalidate(1, content = $$props.content);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		title,
    		content,
    		isOpen,
    		onClose,
    		onAccept,
    		input_input_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class CreationModal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			isOpen: 2,
    			onClose: 3,
    			onAccept: 4,
    			title: 0,
    			content: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CreationModal",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*isOpen*/ ctx[2] === undefined && !('isOpen' in props)) {
    			console.warn("<CreationModal> was created without expected prop 'isOpen'");
    		}

    		if (/*onClose*/ ctx[3] === undefined && !('onClose' in props)) {
    			console.warn("<CreationModal> was created without expected prop 'onClose'");
    		}

    		if (/*onAccept*/ ctx[4] === undefined && !('onAccept' in props)) {
    			console.warn("<CreationModal> was created without expected prop 'onAccept'");
    		}
    	}

    	get isOpen() {
    		throw new Error("<CreationModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isOpen(value) {
    		throw new Error("<CreationModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClose() {
    		throw new Error("<CreationModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClose(value) {
    		throw new Error("<CreationModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onAccept() {
    		throw new Error("<CreationModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onAccept(value) {
    		throw new Error("<CreationModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<CreationModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<CreationModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get content() {
    		throw new Error("<CreationModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<CreationModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // import type Todo from "../models/Todo";

    var todoList = [
        { id: v4(), title: "Buy popcorns", content: "", checked: false },
        { id: v4(), title: "Change T-Shirt", content: "", checked: false },
        { id: v4(), title: "Pay Credit Card", content: "", checked: false },
        { id: v4(), title: "Upgrade lincense", content: "", checked: false },
        { id: v4(), title: "Sell old car", content: "", checked: false },
        { id: v4(), title: "Sell TV", content: "", checked: false },
        { id: v4(), title: "Write a key note", content: "", checked: false },
    ];

    /* src/App.svelte generated by Svelte v3.44.3 */

    const { Object: Object_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[11] = list;
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (33:2) {#each todos as item}
    function create_each_block(ctx) {
    	let todocomponent;
    	let updating_item;
    	let current;

    	function func_2() {
    		return /*func_2*/ ctx[7](/*item*/ ctx[10]);
    	}

    	function todocomponent_item_binding(value) {
    		/*todocomponent_item_binding*/ ctx[8](value, /*item*/ ctx[10], /*each_value*/ ctx[11], /*item_index*/ ctx[12]);
    	}

    	let todocomponent_props = { removeTodo: func_2 };

    	if (/*item*/ ctx[10] !== void 0) {
    		todocomponent_props.item = /*item*/ ctx[10];
    	}

    	todocomponent = new Todo({
    			props: todocomponent_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(todocomponent, 'item', todocomponent_item_binding));

    	const block = {
    		c: function create() {
    			create_component(todocomponent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(todocomponent, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const todocomponent_changes = {};
    			if (dirty & /*todos*/ 1) todocomponent_changes.removeTodo = func_2;

    			if (!updating_item && dirty & /*todos*/ 1) {
    				updating_item = true;
    				todocomponent_changes.item = /*item*/ ctx[10];
    				add_flush_callback(() => updating_item = false);
    			}

    			todocomponent.$set(todocomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todocomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todocomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todocomponent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(33:2) {#each todos as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let p;
    	let t2;
    	let a;
    	let t4;
    	let t5;
    	let h2;
    	let t7;
    	let creationmodal;
    	let t8;
    	let div0;
    	let t9;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	creationmodal = new CreationModal({
    			props: {
    				isOpen: /*isModalOpen*/ ctx[1],
    				onClose: /*func*/ ctx[5],
    				onAccept: /*func_1*/ ctx[6]
    			},
    			$$inline: true
    		});

    	let each_value = /*todos*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Todo list example with Svelte";
    			t1 = space();
    			p = element("p");
    			t2 = text("Visit the ");
    			a = element("a");
    			a.textContent = "Svelte tutorial";
    			t4 = text(" to learn how to build Svelte apps.");
    			t5 = space();
    			h2 = element("h2");
    			h2.textContent = "TODO's:";
    			t7 = space();
    			create_component(creationmodal.$$.fragment);
    			t8 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			button = element("button");
    			button.textContent = "+";
    			attr_dev(h1, "class", "py-5 text-4xl font-bold");
    			add_location(h1, file, 22, 1, 634);
    			attr_dev(a, "href", "https://svelte.dev/tutorial");
    			add_location(a, file, 23, 14, 719);
    			add_location(p, file, 23, 1, 706);
    			attr_dev(h2, "class", "py-5 text-2xl font-semibold italic text-blue-400");
    			add_location(h2, file, 25, 1, 818);
    			attr_dev(button, "class", "w-full sm:3/5 md:w-2/5 xl:w-1/4 border-none bg-blue-100 text-white text-[5em] text-bold shadow-md");
    			add_location(button, file, 35, 2, 1249);
    			attr_dev(div0, "class", "w-full py-5 flex flex-row flex-wrap gap-5 justify-center");
    			add_location(div0, file, 31, 1, 1068);
    			attr_dev(div1, "class", "pb-10");
    			add_location(div1, file, 21, 0, 613);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, p);
    			append_dev(p, t2);
    			append_dev(p, a);
    			append_dev(p, t4);
    			append_dev(div1, t5);
    			append_dev(div1, h2);
    			append_dev(div1, t7);
    			mount_component(creationmodal, div1, null);
    			append_dev(div1, t8);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div0, t9);
    			append_dev(div0, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const creationmodal_changes = {};
    			if (dirty & /*isModalOpen*/ 2) creationmodal_changes.isOpen = /*isModalOpen*/ ctx[1];
    			if (dirty & /*isModalOpen*/ 2) creationmodal_changes.onClose = /*func*/ ctx[5];
    			if (dirty & /*isModalOpen*/ 2) creationmodal_changes.onAccept = /*func_1*/ ctx[6];
    			creationmodal.$set(creationmodal_changes);

    			if (dirty & /*removeTodo, todos*/ 5) {
    				each_value = /*todos*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, t9);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(creationmodal.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(creationmodal.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(creationmodal);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { todos = todoList } = $$props;
    	let { isModalOpen = false } = $$props;

    	const updateTodo = todo => {
    		$$invalidate(0, todos = todos.map(e => {
    			if (e.id === todo.id) {
    				return todo;
    			}
    		}));
    	};

    	const removeTodo = todo => {
    		$$invalidate(0, todos = todos.filter(e => e.id !== todo.id));
    	};

    	const createTodo = payload => {
    		todos.push(Object.assign({ id: v4(), checked: false }, payload));
    	};

    	const writable_props = ['todos', 'isModalOpen'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const func = () => {
    		$$invalidate(1, isModalOpen = !isModalOpen);
    	};

    	const func_1 = payload => {
    		createTodo(payload);
    		$$invalidate(1, isModalOpen = !isModalOpen);
    	};

    	const func_2 = item => removeTodo(item);

    	function todocomponent_item_binding(value, item, each_value, item_index) {
    		each_value[item_index] = value;
    		$$invalidate(0, todos);
    	}

    	const click_handler = () => {
    		$$invalidate(1, isModalOpen = !isModalOpen);
    	};

    	$$self.$$set = $$props => {
    		if ('todos' in $$props) $$invalidate(0, todos = $$props.todos);
    		if ('isModalOpen' in $$props) $$invalidate(1, isModalOpen = $$props.isModalOpen);
    	};

    	$$self.$capture_state = () => ({
    		uuidV4: v4,
    		TodoComponent: Todo,
    		CreationModal,
    		todoList,
    		todos,
    		isModalOpen,
    		updateTodo,
    		removeTodo,
    		createTodo
    	});

    	$$self.$inject_state = $$props => {
    		if ('todos' in $$props) $$invalidate(0, todos = $$props.todos);
    		if ('isModalOpen' in $$props) $$invalidate(1, isModalOpen = $$props.isModalOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		todos,
    		isModalOpen,
    		removeTodo,
    		createTodo,
    		updateTodo,
    		func,
    		func_1,
    		func_2,
    		todocomponent_item_binding,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			todos: 0,
    			isModalOpen: 1,
    			updateTodo: 4,
    			removeTodo: 2,
    			createTodo: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get todos() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isModalOpen() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isModalOpen(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get updateTodo() {
    		return this.$$.ctx[4];
    	}

    	set updateTodo(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeTodo() {
    		return this.$$.ctx[2];
    	}

    	set removeTodo(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get createTodo() {
    		return this.$$.ctx[3];
    	}

    	set createTodo(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
