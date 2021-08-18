// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract WeightRecorder{
    struct UserWeight {
        mapping(string=>uint8) weight_mapping;
        string[] time_list;
    }

    mapping(address=>UserWeight) user_weight;

    address _owner;


    constructor(){
        _owner = msg.sender;
    }

    function record(string memory time_string, uint8 weight) public returns(bool){
        user_weight[msg.sender].weight_mapping[time_string] = weight;
        user_weight[msg.sender].time_list.push(time_string);
        return true;
    }

    function getRecords() public view returns(string[] memory, uint8[] memory){
        return _getRecords(msg.sender);
    }


    modifier onlyOwner(){
        require(msg.sender == _owner, "only onwner can call");
        _;
    }

    function getOneUserRecords(address addr) public view onlyOwner returns(string[] memory, uint8[] memory){
        return _getRecords(addr);
    }

    function _getRecords(address addr) private view returns(string[] memory, uint8[] memory) {
        UserWeight storage weight_item = user_weight[addr];
        string[] memory time_string_array = new string[](weight_item.time_list.length);
        uint8[] memory weight_array = new uint8[](weight_item.time_list.length);

        for(uint8 index;index<weight_item.time_list.length; index++){
            string memory time_string = weight_item.time_list[index];
            uint8 weight_value = weight_item.weight_mapping[time_string];

            time_string_array[index] = time_string;
            weight_array[index] = weight_value;
        }

        return (time_string_array, weight_array);
    }


}