package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import com.aliyun.fsi.insurance.passinfo.shared.mask.MaskRetention;
import com.aliyun.fsi.insurance.passinfo.shared.mask.SensitiveTypeEnum;
import lombok.Data;

import java.io.Serializable;

/**
 *车主信息
 */
@Data
public class VehicleOwnerMG implements Serializable {
    private static final long serialVersionUID = 8957592269048284031L;

    /**
     * 客户域uid
     */
    private String uid;

    /** 证件类型  */
    private String certTypeCd;

    /** 证件号码 */
    @MaskRetention(
            type = SensitiveTypeEnum.DEFAULT,
            group = {0})
    private String certNo;

    /**
     * 车主名称
     */
    @MaskRetention(
            type = SensitiveTypeEnum.DEFAULT,
            group = {0})
    private String vehicleOwnerName;
}
