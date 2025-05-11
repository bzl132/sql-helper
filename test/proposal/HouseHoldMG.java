package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

/**
 * 家财字段
 * @author 248491530476454305
 */
@Data
public class HouseHoldMG {
    /**
     * 详细地址
     */
    private String houseDtlAddr;

    /**
     * 门牌号
     */
    private String houseNum;

    /**
     * 经度
     */
    private String longt;

    /**
     * 纬度
     */
    private String lat;
}
