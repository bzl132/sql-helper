package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import com.aliyun.fsi.insurance.insuredobject.core.facade.dto.common.MoneyDTO;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 车辆信息
 */
@Data
public class VehicleInfoMG implements Serializable {

    private static final long serialVersionUID = -4223573748675786316L;

    /**
     * 车架号
     */
    private String vin;

    /**
     * 车牌号
     */
    private String licenseNo;

    /**
     * 发动机号
     */
    private String engineNo;

    /** 车辆种类代码-中华 */
    private String chinaVehClassCd;

    /** 使用性质-中华 */
    private String chinaUsageCode;

    /** 细化车型 */
    private String vehicleModelCate;

    /**是否新能源*/
    private String industryIsNewEnergyVehicle;

    /** 车系名称 */
    private String seriesName;

    /** 车系编码 */
    private String seriesCode;

    /** 品牌名称（中文） */
    private String brandNameCn;

    /** 品牌编码 */
    private String brandCode;

    /**车龄*/
    private BigDecimal vehicleAge;

    /**新车购置价格 */
    private MoneyDTO purchasePrice;

    /**
     * 机具号牌(农险)
     */
    private String manufacturingCode;

}
