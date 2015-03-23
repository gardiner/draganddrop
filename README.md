Sortable
========

Basic jQuery plugin to allow sorting of lists and other nested html structures (```ul```, ```ol```, ```div``` etc.) via drag and drop.



Requirements
------------

- jQuery



Usage
-----

See [demo.html](demo/demo.html) for a working demo.

1. Include jQuery and sortable in document head:

    ```html
    <link href='bower_components/sortable/src/sortable.css' rel='stylesheet' type='text/css'/>
    <script src='bower_components/jquery/dist/jquery.min.js' type='text/javascript'></script>
    <script src='bower_components/sortable/src/sortable.js' type='text/javascript'></script>
    ```

2. Create nested structure inside html:

    ```html
    <ul id="list">
        <li>Item 1</li>
        <li>Item 2
            <ul>
                <li>Subitem 1</li>
                <li>Subitem 2
                    <ul>
                        <li>Sub-Subitem 1</li>
                    </ul>
                </li>
            </ul>
        </li>
        <li>Item 3</li>
    </ul>
    ```

3. Initialize sortable:

    ```javascript
    $('#list').sortable(/* see below for options/callbacks and commands */);
    ```



Options and callbacks
---------------------

During initialization you can specifiy an options object with following keys:

* ```container``` - selector for container elements
* ```nodes``` - selector for node elements
* ```autocreate``` - automatically create nested containers within nodes



Commands
--------

You can invoke commands on existing sortable instances:

```javascript
$('#list').sortable(); //initializes the sortable

//later...
$('#list').sortable('destroy'); //invokes the destroy command
```

* ```destroy``` - deactivates the sortable instance and unbinds all listeners

