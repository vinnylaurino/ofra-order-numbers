var jsonUrl = "https://api.airtable.com/v0/app85WLPCysvMb4vj/orders?api_key=key1puFSUx6VTe5pj";
var Airtable = require('airtable');
var base = new Airtable({
    apiKey: 'key1puFSUx6VTe5pj'
}).base('app85WLPCysvMb4vj');
var form = document.querySelector("#orderForm");
var d = new Date();
var month = d.getMonth() + 1;
var day = d.getDate();
var currentDay = d.getFullYear() + '-' +
    (('' + month).length < 2 ? '0' : '') + month + '-' +
    (('' + day).length < 2 ? '0' : '') + day;
    var currentDayFormatted =
        (('' + month).length < 2 ? '0' : '') + month + '-' +
        (('' + day).length < 2 ? '0' : '') + day;
var orderNum = $("#newOrderNumber").val();
var currentTime = '';
var rowItem = '';
var duplicate = false;


form.addEventListener("submit", function(event) {
    if ($('#newOrderNumber').val() != '') {
        event.preventDefault();
                  function addZero(i) {
            if (i < 10) {
              i = "0" + i;
            }
            return i;
          };
        var orderNum = $("#newOrderNumber").val();
        var currentDate = new Date();
        var currentTime = `${addZero(currentDate.getHours())}:${addZero(currentDate.getMinutes())}  ${currentDayFormatted}`;

        checkDuplicates(orderNum, currentTime, duplicate); // CREATES THE ORDER BUT CHECKS FOR DUPES FIRST
    }
    setTimeout(function() {
        $("#newOrderNumber").focus().val('');
    }, 250);
});

function registerOrder(orderNum, currentTime) { // FUNCTION TO CREATE THE ORDER
    var rowItem = '<div class="item-row flex-row row"><div data-order-number="' + orderNum + '" class="order-number fifty">' + orderNum + '</div><div data-order-time="' + currentTime + '" class="order-time fifty">' + currentTime + '</div>'
    base('Orders').create({
            "OrderNum": orderNum,
            "OrderDate": currentTime
        },
        function(err, record) {
            if (err) {
                console.error(err);
                return;
            }
            $(rowItem).appendTo('#currentOrders'); // THIS ADDS THE ITEM TO THE PAGE ITSELF
            goToBottom();
            //console.log(rowItem);
            //console.log(record.id);
        })
}

function checkDuplicates(orderNum, currentTime, duplicate) { // FUNCTION TO CHECK FOR DUPLICATES
    return $.ajax({
        type: "GET",
        url: jsonUrl,
        success: function findDupe(data, duplicate) {
            function compareRecords() {
                var inputItem = data.records
                $(inputItem).each(function(index, val) {
                    if (val.fields.OrderNum == orderNum) {
                        duplicate = true;
                        return false; // break
                    }
                });
                if (duplicate == true) {

                    dupePop();
                    return true
                }
            }
            //console.log('compareRecords is ',compareRecords());
            if (compareRecords() != true) {
                registerOrder(orderNum, currentTime); // CREATES THE ORDER
            }
        },
        error: function() {
            console.log('Error occured fetching data');
        }
    });
}

function getDataAndBuild() { // FUNCTION TO POPULATE THE PAGE WITH CURRENT ORDERS AND DELETES ANY DUPLICATES FROM THE SYSTEM
    $.ajax({
        type: "GET",
        url: jsonUrl,
        success: function(data) {
            console.log(data);
            var inputItem = data.records
            //console.log(data.records);
            var unique_values = {};
            var list_of_values = [];
            $.each(inputItem, function(index, val) {
                var rowItem = '<div class="item-row flex-row row"><div data-order-number="' + val.fields.OrderNum + '" class="order-number fifty">' + val.fields.OrderNum + '</div><div data-order-time="' + val.fields.OrderDate + '" class="order-time fifty ">' + val.fields.OrderDate + '</div>'
                //console.log('value is',val.fields);
                //console.log(rowItem);
                if (!unique_values[val.fields.OrderNum]) {
                    unique_values[val.fields.OrderNum] = true;
                    list_of_values.push(val.OrderNum);
                    $(rowItem).appendTo('#currentOrders');
                    goToBottom();
                } else {
                    // console.log('there is a dupe');
                    // $(rowItem).addClass('duplicate-value').appendTo('#currentOrders');
                    base('Orders').destroy(val.id, function(err, deletedRecord) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        console.log('Deleted record', deletedRecord.id);
                    });
                }
            });
        },
        error: function() {
            console.log('Error occured checking limit');
        }
    });
}
getDataAndBuild(); // POPULATE THE PAGE

// modal instead of alert
var modal = document.getElementById('myModal');

function dupePop() {
    modal.style.display = "block";
};

function goToBottom() {
    var findCurrentOrder = $('#currentOrders');
    findCurrentOrder.scrollTop(findCurrentOrder.prop("scrollHeight"));
};

function exportData() { // generate csv
    var csvContent = 'data:text/csv;charset=utf-8,';
    $('#currentOrders .item-row').each(function(orderInfo, val) {
        var orderNum = $('.order-number', this).data('order-number');
        var orderTime = $('.order-time', this).data('order-time');
        var arrayInfo = orderNum + ',' + orderTime
        console.log(orderNum + ',' + orderTime);
        dataString = orderNum + ',' + orderTime
        //console.log(orderInfo, val);
        csvContent += dataString + "\n";

    });

    var encodedUri = encodeURI(csvContent);
    console.log(csvContent);
    $('#exportBtn').attr('download', 'ofraOrders' + currentDay + '.csv').attr('href', encodedUri);
    //window.open(encodedUri);
}
$('#exportBtn').click(function() {
    exportData();
});

function deleteAllOrders() {
    if (confirm('Confirmar borrar todos los pedidos')) {
        $.ajax({
            type: "GET",
            url: jsonUrl,
            success: function(data) {
                var inputItem = data.records
                $.each(inputItem, function(index, val) {
                    base('Orders').destroy(val.id, function(err, deletedRecord) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        console.log('Deleted record', deletedRecord.id);
                    });
                });
            }
        });
        $('.number-recall').html('');
    } else {
        //console.log('delete canceled');
    }
}
$('#deleteAll').click(function() {
    deleteAllOrders();
});
